import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { as, useTestApp } from "./setup/harness.js";
import { createComment, createPost, createUser, minutesAgo, pin, vote } from "./setup/factories.js";

const ctx = useTestApp();
const ids = (res) => res.body.map((p) => p.id);

test("/me returns only the caller's id, name and role", async () => {
  await createUser({ id: "u", name: "Una", role: "MODERATOR" });
  const res = await request(ctx.app).get("/api/me").set(as("u"));
  assert.deepEqual(res.body, { id: "u", name: "Una", role: "MODERATOR" });
});

test("/me/pins lists pinned posts across topics, most recently pinned first", async () => {
  const user = await createUser({ id: "u" });
  const author = await createUser({ id: "author" });
  const qg = await createPost({ author, id: "qg-post", topicSlug: "qg" });
  const ml = await createPost({ author, id: "ml-post", topicSlug: "ml" });
  await createPost({ author, id: "unpinned" });
  await pin(qg, user, minutesAgo(10));
  await pin(ml, user, minutesAgo(1));

  assert.equal((await request(ctx.app).get("/api/me/pins")).status, 401);
  assert.deepEqual(ids(await request(ctx.app).get("/api/me/pins").set(as("u"))), ["ml-post", "qg-post"]);
});

test("recommendations favor unseen posts in topics you engaged with, then backfill", async () => {
  const user = await createUser({ id: "u" });
  const author = await createUser({ id: "author" });
  const fan = await createUser({ id: "fan" });

  const seen = await createPost({ author, id: "seen", topicSlug: "qg" });
  const commented = await createPost({ author, id: "commented", topicSlug: "qg" });
  const qgTop = await createPost({ author, id: "qg-top", topicSlug: "qg" });
  await createPost({ author, id: "qg-plain", topicSlug: "qg" });
  const elsewhereTop = await createPost({ author, id: "ml-top", topicSlug: "ml" });
  await createPost({ author, id: "ml-plain", topicSlug: "ml" });
  await createPost({ author, id: "qg-pending", topicSlug: "qg", status: "PENDING" });

  await vote(seen, user, 1);
  await createComment({ post: commented, author: user });
  await vote(qgTop, fan, 1);
  await vote(elsewhereTop, fan, 1);
  await vote(elsewhereTop, author, 1);

  const res = await request(ctx.app).get("/api/me/recommendations").set(as("u"));
  assert.equal(res.status, 200);
  // Topic matches first (ranked), then global backfill (ranked); nothing already engaged with.
  assert.deepEqual(ids(res), ["qg-top", "qg-plain", "ml-top", "ml-plain"]);
  assert.deepEqual(ids(await request(ctx.app).get("/api/me/recommendations?limit=1").set(as("u"))), ["qg-top"]);
});

test("a brand-new account gets the global top posts", async () => {
  await createUser({ id: "u" });
  const author = await createUser({ id: "author" });
  await createPost({ author, id: "plain" });
  const liked = await createPost({ author, id: "liked" });
  await vote(liked, author, 1);

  assert.deepEqual(ids(await request(ctx.app).get("/api/me/recommendations").set(as("u"))), ["liked", "plain"]);
});
