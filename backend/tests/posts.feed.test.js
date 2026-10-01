import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { as, useTestApp } from "./setup/harness.js";
import { createComment, createPost, createUser, minutesAgo, vote } from "./setup/factories.js";

const ctx = useTestApp();
const ids = (res) => res.body.map((p) => p.id);

async function seedFeed() {
  const author = await createUser({ id: "author" });
  const other = await createUser({ id: "other" });
  const mod = await createUser({ id: "mod", role: "MODERATOR" });
  const older = await createPost({ author, id: "older", topicSlug: "qg", createdAt: minutesAgo(30) });
  const newer = await createPost({ author: other, id: "newer", topicSlug: "gs", createdAt: minutesAgo(10) });
  const mine = await createPost({ author, id: "mine", status: "PENDING", createdAt: minutesAgo(5) });
  const theirs = await createPost({ author: other, id: "theirs", status: "PENDING", createdAt: minutesAgo(1) });
  await createPost({ author: other, id: "rejected", status: "REJECTED" });
  return { author, other, mod, older, newer, mine, theirs };
}

test("the feed shows approved posts, newest first", async () => {
  await seedFeed();
  const res = await request(ctx.app).get("/api/posts");
  assert.equal(res.status, 200);
  assert.deepEqual(ids(res), ["newer", "older"]);
});

test("the feed adds your own pending posts, or all of them for a moderator", async () => {
  await seedFeed();
  assert.deepEqual(ids(await request(ctx.app).get("/api/posts").set(as("author"))), ["mine", "newer", "older"]);
  assert.deepEqual(ids(await request(ctx.app).get("/api/posts").set(as("mod"))), ["theirs", "mine", "newer", "older"]);
});

test("the feed filters by topic", async () => {
  await seedFeed();
  assert.deepEqual(ids(await request(ctx.app).get("/api/posts?topicSlug=gs")), ["newer"]);
});

test("a non-string topicSlug is rejected", async () => {
  const res = await request(ctx.app).get("/api/posts?topicSlug[not]=x");
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "topicSlug must be a string" });
});

test("a post serializes to the shape the frontend expects", async () => {
  const author = await createUser({ id: "author" });
  const voter = await createUser({ id: "voter" });
  const post = await createPost({ author, id: "p1", title: "Résumé of Genomic Selection!" });
  await vote(post, voter, 1);
  await createComment({ post, author: voter });
  await createComment({ post, author: voter, deletedAt: new Date() });

  const [anon] = (await request(ctx.app).get("/api/posts")).body;
  assert.deepEqual(Object.keys(anon).sort(), [
    "abstract", "authorAvatarUrl", "authorId", "authorName", "commentCount", "createdAt", "downvotes", "htmlSlug",
    "id", "linkedPostCount", "locked", "pinnedBy", "slug", "status", "title", "topicSlug", "updatedAt", "upvotes",
  ]);
  assert.equal(anon.slug, "resume-of-genomic-selection");
  assert.deepEqual(anon.upvotes, ["voter"]);
  assert.equal(anon.commentCount, 1);
  assert.equal(anon.linkedPostCount, 0);

  // Review detail is only for the author (or a moderator).
  const [own] = (await request(ctx.app).get("/api/posts").set(as("author"))).body;
  assert.ok("reviewedById" in own && "reviewedAt" in own && "rejectionReason" in own);
});

test("top posts rank by votes and comments, capped by limit", async () => {
  const author = await createUser({ id: "author" });
  const [a, b, c] = await Promise.all(["voter1", "voter2", "voter3"].map((id) => createUser({ id })));
  await createPost({ author, id: "quiet" });
  const voted = await createPost({ author, id: "voted" });
  const discussed = await createPost({ author, id: "discussed" });
  const disliked = await createPost({ author, id: "disliked" });
  await createPost({ author, id: "pending", status: "PENDING" });
  await vote(voted, a, 1);
  await vote(voted, b, 1);
  await vote(voted, c, 1); // score 3
  await createComment({ post: discussed, author: a });
  await createComment({ post: discussed, author: b }); // score 4
  await vote(disliked, a, -1); // score -1

  assert.deepEqual(ids(await request(ctx.app).get("/api/posts/top")), ["discussed", "voted", "quiet", "disliked"]);
  assert.deepEqual(ids(await request(ctx.app).get("/api/posts/top?limit=2")), ["discussed", "voted"]);
});

test("search matches every word in the title or abstract, case-insensitively", async () => {
  const author = await createUser();
  await createPost({ author, id: "both", title: "Genomic selection basics", abstract: "Ridge regression" });
  await createPost({ author, id: "title-only", title: "Genomic prediction", abstract: "Nothing here" });
  await createPost({ author, id: "hidden", status: "PENDING", title: "Genomic ridge" });

  assert.deepEqual(ids(await request(ctx.app).get("/api/posts/search?q=GENOMIC ridge")), ["both"]);
  assert.deepEqual(ids(await request(ctx.app).get("/api/posts/search?q=genomic")).sort(), ["both", "title-only"]);
  assert.deepEqual((await request(ctx.app).get("/api/posts/search?q=")).body, []);
  assert.deepEqual((await request(ctx.app).get("/api/posts/search")).body, []);
});

test("GET /posts/:id includes the stitched HTML unless ?html=0", async () => {
  const author = await createUser();
  const post = await createPost({ author, id: "p1" });
  ctx.stores.html.put("p1.html", "<h1>Hello</h1>");

  const full = await request(ctx.app).get(`/api/posts/${post.id}`);
  assert.equal(full.status, 200);
  assert.equal(full.body.html, "<h1>Hello</h1>");

  const meta = await request(ctx.app).get(`/api/posts/${post.id}?html=0`);
  assert.equal(meta.status, 200);
  assert.ok(!("html" in meta.body));
});

test("GET /posts/:id hides unapproved posts from everyone but the author and moderators", async () => {
  await seedFeed();
  for (const headers of [{}, as("other")]) {
    const res = await request(ctx.app).get("/api/posts/mine").set(headers);
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: "Post not found" });
  }
  for (const id of ["author", "mod"]) {
    const res = await request(ctx.app).get("/api/posts/mine").set(as(id));
    assert.equal(res.status, 200);
    assert.equal(res.body.html, null);
  }
});

test("GET /posts/:id is a 404 for an unknown id", async () => {
  const res = await request(ctx.app).get("/api/posts/nope");
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: "Post not found" });
});
