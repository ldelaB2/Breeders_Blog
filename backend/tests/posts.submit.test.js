import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { as, prisma, useTestApp } from "./setup/harness.js";
import { createPost, createUser } from "./setup/factories.js";

const ctx = useTestApp();

const uploadUrl = (userId, filename = "my post.qmd") =>
  request(ctx.app).post("/api/posts/upload-url").set(as(userId)).send({ filename });

// Steps 1 + 2 of submitting, with the browser's direct upload in between.
async function submit(userId, overrides = {}, { upload = "# Hello", size } = {}) {
  const ticket = (await uploadUrl(userId, overrides.originalFilename ?? "my post.qmd")).body;
  if (upload !== null) ctx.stores.upload.put(ticket.rawSlug, upload, { size });
  const res = await request(ctx.app)
    .post("/api/posts")
    .set(as(userId))
    .send({
      id: ticket.postId,
      rawSlug: ticket.rawSlug,
      topicSlug: "qg",
      title: "My post",
      abstract: "What it's about",
      originalFilename: "my post.qmd",
      ...overrides,
    });
  return { ticket, res };
}

async function postsInLastDay(author, count) {
  for (let i = 0; i < count; i++) await createPost({ author, id: `recent_${i}` });
}

test("upload-url requires sign-in", async () => {
  const res = await request(ctx.app).post("/api/posts/upload-url").send({ filename: "x.md" });
  assert.equal(res.status, 401);
});

test("upload-url only accepts .md, .qmd, .rmd and .zip", async () => {
  await createUser({ id: "u" });
  for (const body of [{ filename: "x.pdf" }, { filename: "noext" }, {}]) {
    const res = await request(ctx.app).post("/api/posts/upload-url").set(as("u")).send(body);
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: "File must be a .md, .qmd, .rmd, or .zip" });
  }
});

test("upload-url mints a ticket with a fixed object name", async () => {
  await createUser({ id: "u" });
  const md = await uploadUrl("u", "Notes.QMD");
  assert.equal(md.status, 200);
  assert.equal(md.body.rawSlug, `${md.body.postId}/upload.qmd`);
  assert.equal(md.body.contentType, "text/markdown");
  assert.match(md.body.signedUrl, /^https:\/\//);

  const zip = await uploadUrl("u", "bundle.zip");
  assert.equal(zip.body.contentType, "application/zip");
});

test("a new upload-url discards the user's previous ticket and its upload", async () => {
  await createUser({ id: "u" });
  const first = (await uploadUrl("u")).body;
  ctx.stores.upload.put(first.rawSlug, "draft");
  const second = (await uploadUrl("u")).body;

  assert.equal(ctx.stores.upload.objects.has(first.rawSlug), false);
  const tickets = await prisma.pendingPostUpload.findMany();
  assert.deepEqual(tickets.map((t) => t.id), [second.postId]);
});

test("upload-url refuses a user already at the daily post limit", async () => {
  const author = await createUser({ id: "u" });
  await postsInLastDay(author, 5);
  const res = await uploadUrl("u");
  assert.equal(res.status, 429);
  assert.deepEqual(res.body, { error: "You can only submit 5 posts per 24 hours. Please try again later." });
});

test("submitting creates a pending post, consumes the ticket and emails admins", async () => {
  await createUser({ id: "u", name: "Ursula" });
  await createUser({ id: "admin", role: "ADMIN", email: "admin@example.com" });

  const { ticket, res } = await submit("u", { originalFilename: "../../my post.qmd" });
  assert.equal(res.status, 201);
  assert.equal(res.body.id, ticket.postId);
  assert.equal(res.body.status, "PENDING");
  assert.equal(res.body.authorName, "Ursula");
  assert.equal(res.body.title, "My post");

  const body = await prisma.postBody.findUnique({ where: { postId: ticket.postId } });
  assert.equal(body.rawOriginalName, "my post.qmd"); // basename only
  assert.equal(await prisma.pendingPostUpload.count(), 0);

  assert.equal(ctx.mailer.sent.length, 1);
  assert.deepEqual(ctx.mailer.sent[0].to, ["admin@example.com"]);
  assert.equal(ctx.mailer.sent[0].subject, "New post pending review: My post");
});

test("a backslash-separated filename is cut to its last segment too", async () => {
  await createUser({ id: "u" });
  const { ticket, res } = await submit("u", { originalFilename: "a\\..\\..\\my post.qmd" });
  assert.equal(res.status, 201);
  const body = await prisma.postBody.findUnique({ where: { postId: ticket.postId } });
  assert.equal(body.rawOriginalName, "my post.qmd");
});

test("submitting validates the text fields and topic", async () => {
  await createUser({ id: "u" });
  const cases = [
    [{ title: "  " }, "title is required"],
    [{ title: "x".repeat(101) }, "title must be 100 characters or fewer"],
    [{ abstract: { evil: true } }, "abstract is required"],
    [{ topicSlug: "cooking" }, "Unknown topic"],
  ];
  for (const [overrides, error] of cases) {
    const { res } = await submit("u", overrides);
    assert.equal(res.status, 400, error);
    assert.deepEqual(res.body, { error });
  }
});

test("submitting needs a ticket the same user minted for that upload", async () => {
  await createUser({ id: "u" });
  await createUser({ id: "thief" });
  const ticket = (await uploadUrl("u")).body;
  const error = "Upload ticket not found or already used - try uploading again";

  const stolen = await request(ctx.app)
    .post("/api/posts")
    .set(as("thief"))
    .send({ id: ticket.postId, rawSlug: ticket.rawSlug, topicSlug: "qg", title: "t", abstract: "a", originalFilename: "a.qmd" });
  assert.equal(stolen.status, 403);
  assert.deepEqual(stolen.body, { error });

  const { res } = await submit("u", { rawSlug: "someone-else/upload.qmd" });
  assert.equal(res.status, 403);
  assert.deepEqual(res.body, { error });
});

test("submitting rejects a filename that doesn't match the uploaded type", async () => {
  await createUser({ id: "u" });
  const ticket = (await uploadUrl("u", "post.qmd")).body;
  ctx.stores.upload.put(ticket.rawSlug, "# hi");
  const res = await request(ctx.app)
    .post("/api/posts")
    .set(as("u"))
    .send({ id: ticket.postId, rawSlug: ticket.rawSlug, topicSlug: "qg", title: "t", abstract: "a", originalFilename: "post.zip" });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "originalFilename doesn't match the uploaded file type" });
});

test("submitting before the upload lands keeps the ticket for a retry", async () => {
  await createUser({ id: "u" });
  const { res } = await submit("u", {}, { upload: null });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Upload not found - try uploading again" });
  assert.equal(await prisma.pendingPostUpload.count(), 1);
});

test("an upload over 50 MB is rejected and discarded", async () => {
  await createUser({ id: "u" });
  const { ticket, res } = await submit("u", {}, { size: 50 * 1024 * 1024 + 1 });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "File is too large - uploads must be under 50 MB" });
  assert.equal(ctx.stores.upload.objects.has(ticket.rawSlug), false);
  assert.equal(await prisma.pendingPostUpload.count(), 0);
});

test("hitting the post limit between the two steps discards the upload", async () => {
  const author = await createUser({ id: "u" });
  const ticket = (await uploadUrl("u")).body;
  ctx.stores.upload.put(ticket.rawSlug, "# hi");
  await postsInLastDay(author, 5);

  const res = await request(ctx.app)
    .post("/api/posts")
    .set(as("u"))
    .send({ id: ticket.postId, rawSlug: ticket.rawSlug, topicSlug: "qg", title: "t", abstract: "a", originalFilename: "a.qmd" });
  assert.equal(res.status, 429);
  assert.equal(ctx.stores.upload.objects.has(ticket.rawSlug), false);
  assert.equal(await prisma.pendingPostUpload.count(), 0);
});

// Steps 1 + 2 with a share image alongside the raw upload.
async function submitWithImage(userId, { imageFilename = "figure.PNG", image = "png-bytes", size, imageSlug } = {}) {
  const ticket = (await request(ctx.app).post("/api/posts/upload-url").set(as(userId)).send({ filename: "a.qmd", imageFilename }))
    .body;
  ctx.stores.upload.put(ticket.rawSlug, "# hi");
  if (image !== null) ctx.stores.image.put(ticket.image.slug, image, { size });
  const res = await request(ctx.app)
    .post("/api/posts")
    .set(as(userId))
    .send({
      id: ticket.postId,
      rawSlug: ticket.rawSlug,
      imageSlug: imageSlug ?? ticket.image.slug,
      topicSlug: "qg",
      title: "t",
      abstract: "a",
      originalFilename: "a.qmd",
    });
  return { ticket, res };
}

test("upload-url mints a share-image URL too, and only for png, jpg or webp", async () => {
  await createUser({ id: "u" });
  const { body } = await request(ctx.app).post("/api/posts/upload-url").set(as("u")).send({ filename: "a.md", imageFilename: "Fig 1.JPG" });
  assert.deepEqual(body.image, {
    slug: `${body.postId}/share.jpg`,
    signedUrl: `https://storage.test/post-image/${body.postId}/share.jpg?token=signed`,
    contentType: "image/jpeg",
  });
  assert.equal((await uploadUrl("u")).body.image, null);

  for (const imageFilename of ["x.svg", "x.gif", "noext"]) {
    const res = await request(ctx.app).post("/api/posts/upload-url").set(as("u")).send({ filename: "a.md", imageFilename });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: "Share image must be a .png, .jpg, or .webp" });
  }
});

test("submitting with a share image saves it and serializes its public URL", async () => {
  await createUser({ id: "u" });
  const { ticket, res } = await submitWithImage("u");
  assert.equal(res.status, 201);
  assert.equal(res.body.imageUrl, `https://storage.test/storage/v1/object/public/post-image/${ticket.postId}/share.png`);
  const body = await prisma.postBody.findUnique({ where: { postId: ticket.postId } });
  assert.equal(body.imageSlug, `${ticket.postId}/share.png`);

  const plain = await submit("u");
  assert.equal(plain.res.body.imageUrl, null);
});

test("submitting needs the share image the ticket was minted for", async () => {
  await createUser({ id: "u" });
  const { res } = await submitWithImage("u", { imageSlug: "someone-else/share.png" });
  assert.equal(res.status, 403);
  assert.deepEqual(res.body, { error: "Upload ticket not found or already used - try uploading again" });
});

test("submitting checks the share image landed and is under 5 MB", async () => {
  await createUser({ id: "u" });
  const missing = await submitWithImage("u", { image: null });
  assert.equal(missing.res.status, 400);
  assert.deepEqual(missing.res.body, { error: "Share image not found - try uploading again" });

  const big = await submitWithImage("u", { size: 5 * 1024 * 1024 + 1 });
  assert.equal(big.res.status, 400);
  assert.deepEqual(big.res.body, { error: "Share image is too large - images must be under 5 MB" });
  assert.equal(await prisma.postMetadata.count(), 0);
  // An oversized image can never be used, so its ticket and files go too.
  assert.equal(await prisma.pendingPostUpload.count(), 0);
  assert.equal(ctx.stores.image.objects.has(big.ticket.image.slug), false);
});

test("a new upload-url discards the previous ticket's share image too", async () => {
  await createUser({ id: "u" });
  const first = (await request(ctx.app).post("/api/posts/upload-url").set(as("u")).send({ filename: "a.md", imageFilename: "f.png" }))
    .body;
  ctx.stores.image.put(first.image.slug, "png");
  await uploadUrl("u");
  assert.equal(ctx.stores.image.objects.has(first.image.slug), false);
});
