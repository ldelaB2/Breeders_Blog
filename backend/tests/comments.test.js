import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { as, useTestApp } from "./setup/harness.js";
import { createComment, createPost, createUser, minutesAgo } from "./setup/factories.js";

const ctx = useTestApp();

async function seed() {
  const author = await createUser({ id: "author", name: "Ann" });
  await createUser({ id: "other" });
  await createUser({ id: "mod", role: "MODERATOR" });
  const post = await createPost({ author, id: "post" });
  const otherPost = await createPost({ author, id: "other-post" });
  await createPost({ author, id: "locked", locked: true });
  await createPost({ author, id: "pending", status: "PENDING" });
  return { author, post, otherPost };
}

const comment = (userId, postId, body) => request(ctx.app).post(`/api/posts/${postId}/comments`).set(as(userId)).send(body);

test("a post's comments list oldest first, with deleted text hidden", async () => {
  const { author, post } = await seed();
  await createComment({ post, author, text: "second", createdAt: minutesAgo(1) });
  await createComment({ post, author, text: "gone", deletedAt: new Date(), createdAt: minutesAgo(5) });

  const res = await request(ctx.app).get("/api/posts/post/comments");
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body[0]).sort(), [
    "authorId", "authorName", "createdAt", "deleted", "downvotes", "id", "parentId", "postId", "text", "upvotes",
  ]);
  assert.deepEqual(res.body.map((c) => [c.text, c.deleted]), [[null, true], ["second", false]]);
});

test("commenting creates a trimmed comment", async () => {
  await seed();
  const res = await comment("author", "post", { text: "  Nice post  " });
  assert.equal(res.status, 201);
  assert.equal(res.body.text, "Nice post");
  assert.equal(res.body.authorName, "Ann");
  assert.equal(res.body.parentId, null);

  // The frontend sends an explicit null for a top-level comment.
  const explicit = await comment("author", "post", { text: "Top level", parentId: null });
  assert.equal(explicit.status, 201);
  assert.equal(explicit.body.parentId, null);
});

test("commenting validates the text and parent", async () => {
  const { author, otherPost } = await seed();
  const elsewhere = await createComment({ post: otherPost, author });
  const cases = [
    [{ text: "" }, "text is required"],
    [{ text: "x".repeat(5001) }, "text must be 5000 characters or fewer"],
    [{ text: "hi", parentId: 5 }, "parentId must be a string"],
    [{ text: "hi", parentId: elsewhere.id }, "parentId must reference a comment on the same post"],
  ];
  for (const [body, error] of cases) {
    const res = await comment("author", "post", body);
    assert.equal(res.status, 400, error);
    assert.deepEqual(res.body, { error });
  }
});

test("replies thread under a comment on the same post", async () => {
  const { author, post } = await seed();
  const parent = await createComment({ post, author });
  const res = await comment("other", "post", { text: "Agreed", parentId: parent.id });
  assert.equal(res.status, 201);
  assert.equal(res.body.parentId, parent.id);
});

test("locked, unapproved and unknown posts can't be commented on", async () => {
  await seed();
  const locked = await comment("author", "locked", { text: "hi" });
  assert.equal(locked.status, 403);
  assert.deepEqual(locked.body, { error: "Post is locked" });

  for (const postId of ["pending", "nope"]) {
    const res = await comment("author", postId, { text: "hi" });
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: "Post not found" });
  }
});

test("a comment can be deleted by its author or a moderator, not anyone else", async () => {
  const { author, post } = await seed();
  const c1 = await createComment({ post, author });
  const c2 = await createComment({ post, author });

  const denied = await request(ctx.app).delete(`/api/comments/${c1.id}`).set(as("other"));
  assert.equal(denied.status, 403);
  assert.deepEqual(denied.body, { error: "Forbidden" });

  for (const [c, userId] of [[c1, "author"], [c2, "mod"]]) {
    const res = await request(ctx.app).delete(`/api/comments/${c.id}`).set(as(userId));
    assert.equal(res.status, 200);
    assert.deepEqual([res.body.deleted, res.body.text], [true, null]);
  }
});

test("only a moderator can restore a deleted comment", async () => {
  const { author, post } = await seed();
  const deleted = await createComment({ post, author, text: "back again", deletedAt: new Date() });
  const live = await createComment({ post, author });

  assert.equal((await request(ctx.app).post(`/api/comments/${deleted.id}/restore`).set(as("author"))).status, 403);

  const res = await request(ctx.app).post(`/api/comments/${deleted.id}/restore`).set(as("mod"));
  assert.equal(res.status, 200);
  assert.deepEqual([res.body.deleted, res.body.text], [false, "back again"]);

  const notDeleted = await request(ctx.app).post(`/api/comments/${live.id}/restore`).set(as("mod"));
  assert.equal(notDeleted.status, 400);
  assert.deepEqual(notDeleted.body, { error: "Comment is not deleted" });
});
