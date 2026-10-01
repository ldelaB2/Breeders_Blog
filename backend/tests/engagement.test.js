import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { as, useTestApp } from "./setup/harness.js";
import { createComment, createPost, createUser } from "./setup/factories.js";

const ctx = useTestApp();

async function seed() {
  const author = await createUser({ id: "author" });
  await createUser({ id: "voter" });
  const post = await createPost({ author, id: "post" });
  await createPost({ author, id: "pending", status: "PENDING" });
  const comment = await createComment({ post, author });
  return { post, comment };
}

const call = (path) => request(ctx.app).post(path).set(as("voter"));

test("voting on a post toggles and switches like the frontend predicts", async () => {
  await seed();
  let res = await call("/api/posts/post/upvote");
  assert.equal(res.status, 200);
  assert.deepEqual([res.body.upvotes, res.body.downvotes], [["voter"], []]);

  res = await call("/api/posts/post/downvote"); // switch
  assert.deepEqual([res.body.upvotes, res.body.downvotes], [[], ["voter"]]);

  res = await call("/api/posts/post/downvote"); // same again removes it
  assert.deepEqual([res.body.upvotes, res.body.downvotes], [[], []]);
});

test("votes and pins need sign-in and an approved post", async () => {
  await seed();
  assert.equal((await request(ctx.app).post("/api/posts/post/upvote")).status, 401);
  for (const action of ["upvote", "downvote", "pin"]) {
    const res = await call(`/api/posts/pending/${action}`);
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: "Post not found" });
  }
});

test("pinning a post toggles", async () => {
  await seed();
  assert.deepEqual((await call("/api/posts/post/pin")).body.pinnedBy, ["voter"]);
  assert.deepEqual((await call("/api/posts/post/pin")).body.pinnedBy, []);
});

test("voting on a comment toggles and switches", async () => {
  const { comment } = await seed();
  let res = await call(`/api/comments/${comment.id}/upvote`);
  assert.equal(res.status, 200);
  assert.deepEqual([res.body.upvotes, res.body.downvotes], [["voter"], []]);

  res = await call(`/api/comments/${comment.id}/downvote`);
  assert.deepEqual([res.body.upvotes, res.body.downvotes], [[], ["voter"]]);

  res = await call(`/api/comments/${comment.id}/downvote`);
  assert.deepEqual([res.body.upvotes, res.body.downvotes], [[], []]);
});

test("voting on an unknown comment is a 404", async () => {
  await seed();
  const res = await call("/api/comments/nope/upvote");
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: "Comment not found" });
});
