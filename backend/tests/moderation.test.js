import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { as, prisma, useTestApp } from "./setup/harness.js";
import { createComment, createPost, createUser, minutesAgo } from "./setup/factories.js";

const ctx = useTestApp();

async function seed() {
  const author = await createUser({ id: "author", email: "author@example.com" });
  await createUser({ id: "admin", role: "ADMIN" });
  await createUser({ id: "mod", role: "MODERATOR" });
  await createUser({ id: "user" });
  const pending = await createPost({ author, id: "pending", status: "PENDING", title: "Draft & Co", createdAt: minutesAgo(5) });
  const approved = await createPost({ author, id: "approved" });
  return { author, pending, approved };
}

const binary = (res, cb) => {
  const chunks = [];
  res.on("data", (c) => chunks.push(c));
  res.on("end", () => cb(null, Buffer.concat(chunks)));
};

test("the pending queue is admin-only and oldest first", async () => {
  const { author } = await seed();
  await createPost({ author, id: "older", status: "PENDING", createdAt: minutesAgo(60) });

  const res = await request(ctx.app).get("/api/posts/pending").set(as("admin"));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((p) => p.id), ["older", "pending"]);
});

test("approve/upload-url hands out a signed URL for a pending post", async () => {
  await seed();
  const res = await request(ctx.app).post("/api/posts/pending/approve/upload-url").set(as("admin"));
  assert.equal(res.status, 200);
  assert.equal(res.body.htmlSlug, "pending.html");
  assert.match(res.body.signedUrl, /^https:\/\//);

  const notPending = await request(ctx.app).post("/api/posts/approved/approve/upload-url").set(as("admin"));
  assert.equal(notPending.status, 400);
  assert.deepEqual(notPending.body, { error: "Only pending posts can be approved" });

  assert.equal((await request(ctx.app).post("/api/posts/pending/approve/upload-url").set(as("mod"))).status, 403);
  assert.equal((await request(ctx.app).post("/api/posts/nope/approve/upload-url").set(as("admin"))).status, 404);
});

test("approving needs the stitched HTML to have been uploaded", async () => {
  await seed();
  const res = await request(ctx.app).post("/api/posts/pending/approve").set(as("admin"));
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Stitched HTML upload not found - try uploading again" });
});

test("approving publishes the post and emails the author", async () => {
  await seed();
  ctx.stores.html.put("pending.html", "<p>hi</p>");
  const res = await request(ctx.app).post("/api/posts/pending/approve").set(as("admin"));
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "APPROVED");
  assert.equal(res.body.htmlSlug, "pending.html");
  assert.equal(res.body.reviewedById, "admin");

  assert.equal(ctx.mailer.sent.length, 1);
  const [mail] = ctx.mailer.sent;
  assert.equal(mail.to, "author@example.com");
  assert.equal(mail.subject, 'Your post "Draft & Co" was approved');
  assert.match(mail.html, /Draft &amp; Co/);
  assert.match(mail.html, /http:\/\/site\.test\/posts\/pending\/draft-co/);

  const again = await request(ctx.app).post("/api/posts/pending/approve").set(as("admin"));
  assert.equal(again.status, 400);
});

test("rejecting needs a reason, records it and emails the author", async () => {
  await seed();
  const missing = await request(ctx.app).post("/api/posts/pending/reject").set(as("admin")).send({});
  assert.equal(missing.status, 400);
  assert.deepEqual(missing.body, { error: "rejectionReason is required" });

  const res = await request(ctx.app).post("/api/posts/pending/reject").set(as("admin")).send({ rejectionReason: "<b>Too short</b>" });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "REJECTED");
  assert.equal(res.body.rejectionReason, "<b>Too short</b>");
  assert.equal(ctx.mailer.sent[0].subject, 'Your post "Draft & Co" was not approved');
  assert.match(ctx.mailer.sent[0].html, /&lt;b&gt;Too short&lt;\/b&gt;/);

  const notPending = await request(ctx.app).post("/api/posts/approved/reject").set(as("admin")).send({ rejectionReason: "x" });
  assert.equal(notPending.status, 400);
  assert.deepEqual(notPending.body, { error: "Only pending posts can be rejected" });
});

test("download bundles the title, abstract and original upload into a zip", async () => {
  await seed();
  ctx.stores.upload.put("pending/upload.md", "# The original");
  const res = await request(ctx.app).get("/api/posts/pending/download").set(as("admin")).buffer(true).parse(binary);
  assert.equal(res.status, 200);
  assert.equal(res.headers["content-type"], "application/zip");
  assert.equal(res.headers["content-disposition"], 'attachment; filename="pending.zip"');
  const zip = res.body.toString("latin1");
  assert.ok(zip.startsWith("PK"));
  for (const name of ["title.txt", "abstract.txt", "post.md"]) assert.ok(zip.includes(name), name);
});

test("download is a 502 when the original upload can't be fetched", async (t) => {
  t.mock.method(console, "error", () => {});
  await seed();
  const res = await request(ctx.app).get("/api/posts/pending/download").set(as("admin"));
  assert.equal(res.status, 502);
  assert.deepEqual(res.body, { error: "Could not fetch the original upload from storage" });
});

test("deleting a post removes it, its comments and both stored files", async () => {
  const { approved, author } = await seed();
  await createComment({ post: approved, author });
  ctx.stores.html.put("approved.html", "<p/>");
  ctx.stores.upload.put("approved/upload.md", "#");

  assert.equal((await request(ctx.app).delete("/api/posts/approved").set(as("mod"))).status, 403);
  const res = await request(ctx.app).delete("/api/posts/approved").set(as("admin"));
  assert.equal(res.status, 204);
  assert.equal(await prisma.postMetadata.count({ where: { id: "approved" } }), 0);
  assert.equal(await prisma.comment.count(), 0);
  assert.equal(ctx.stores.html.objects.size, 0);
  assert.equal(ctx.stores.upload.objects.size, 0);
});

test("moderators can lock and unlock approved posts", async () => {
  await seed();
  assert.equal((await request(ctx.app).post("/api/posts/approved/lock").set(as("user"))).status, 403);

  const locked = await request(ctx.app).post("/api/posts/approved/lock").set(as("mod"));
  assert.equal(locked.status, 200);
  assert.equal(locked.body.locked, true);
  assert.equal((await request(ctx.app).post("/api/posts/approved/lock").set(as("mod"))).body.locked, false);

  const pending = await request(ctx.app).post("/api/posts/pending/lock").set(as("mod"));
  assert.equal(pending.status, 400);
  assert.deepEqual(pending.body, { error: "Only approved posts can be locked" });
});

test("archiving moves a post to the Archive topic and locks it", async () => {
  await seed();
  const res = await request(ctx.app).post("/api/posts/approved/archive").set(as("mod"));
  assert.equal(res.status, 200);
  assert.equal(res.body.topicSlug, "archive");
  assert.equal(res.body.locked, true);

  const pending = await request(ctx.app).post("/api/posts/pending/archive").set(as("admin"));
  assert.equal(pending.status, 400);
  assert.deepEqual(pending.body, { error: "Only approved posts can be archived" });
});
