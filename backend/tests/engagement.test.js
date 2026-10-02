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
  assert.deepEqual([res.body.upvoteCount, res.body.downvoteCount, res.body.myVote], [1, 0, 1]);

  res = await call("/api/posts/post/downvote"); // switch
  assert.deepEqual([res.body.upvoteCount, res.body.downvoteCount, res.body.myVote], [0, 1, -1]);

  res = await call("/api/posts/post/downvote"); // same again removes it
  assert.deepEqual([res.body.upvoteCount, res.body.downvoteCount, res.body.myVote], [0, 0, 0]);
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
  assert.equal((await call("/api/posts/post/pin")).body.pinned, true);
  assert.equal((await call("/api/posts/post/pin")).body.pinned, false);
});

test("votes and pins are counts plus the viewer's own state - never voter ids", async () => {
  const { comment } = await seed();
  await createUser({ id: "someone" });
  await call("/api/posts/post/upvote");
  await call("/api/posts/post/pin");
  await call(`/api/comments/${comment.id}/downvote`);

  const feed = (as_) => request(ctx.app).get("/api/posts").set(as_ ?? {});
  const comments = (as_) => request(ctx.app).get("/api/posts/post/comments").set(as_ ?? {});
  const views = {
    anon: [(await feed()).body, (await comments()).body],
    voter: [(await feed(as("voter"))).body, (await comments(as("voter"))).body],
    someone: [(await feed(as("someone"))).body, (await comments(as("someone"))).body],
  };
  for (const [posts, list] of Object.values(views)) {
    assert.ok(!JSON.stringify([posts, list]).includes('"voter"'), "no voter id in any response");
  }
  const state = ([posts, list]) => {
    const post = posts.find((p) => p.id === "post");
    return [post.upvoteCount, post.myVote, post.pinned, list[0].downvoteCount, list[0].myVote];
  };
  assert.deepEqual(state(views.anon), [1, 0, false, 1, 0]);
  assert.deepEqual(state(views.voter), [1, 1, true, 1, -1]);
  assert.deepEqual(state(views.someone), [1, 0, false, 1, 0]);
});

test("a post view counts anonymously, only on approved posts", async () => {
  await seed();
  const viewCount = async () => (await request(ctx.app).get("/api/posts/post?html=0")).body.viewCount;

  assert.equal((await request(ctx.app).post("/api/posts/post/view")).status, 204);
  assert.equal((await call("/api/posts/post/view")).status, 204);
  assert.equal(await viewCount(), 2);

  assert.equal((await request(ctx.app).post("/api/posts/pending/view")).status, 404);
  assert.equal((await request(ctx.app).post("/api/posts/nope/view")).status, 404);
});

test("voting on a comment toggles and switches", async () => {
  const { comment } = await seed();
  let res = await call(`/api/comments/${comment.id}/upvote`);
  assert.equal(res.status, 200);
  assert.deepEqual([res.body.upvoteCount, res.body.downvoteCount, res.body.myVote], [1, 0, 1]);

  res = await call(`/api/comments/${comment.id}/downvote`);
  assert.deepEqual([res.body.upvoteCount, res.body.downvoteCount, res.body.myVote], [0, 1, -1]);

  res = await call(`/api/comments/${comment.id}/downvote`);
  assert.deepEqual([res.body.upvoteCount, res.body.downvoteCount, res.body.myVote], [0, 0, 0]);
});

test("voting on an unknown comment is a 404", async () => {
  await seed();
  const res = await call("/api/comments/nope/upvote");
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: "Comment not found" });
});
