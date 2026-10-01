import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { as, prisma, useTestApp } from "./setup/harness.js";
import { createPost, createUser, link } from "./setup/factories.js";

const ctx = useTestApp();

async function seed() {
  const author = await createUser({ id: "author" });
  await createUser({ id: "other" });
  await createUser({ id: "mod", role: "MODERATOR" });
  const source = await createPost({ author, id: "source" });
  const a = await createPost({ author, id: "a" });
  const b = await createPost({ author, id: "b" });
  const pending = await createPost({ author, id: "pending", status: "PENDING" });
  return { source, a, b, pending };
}

const add = (userId, targetPostId) =>
  request(ctx.app).post("/api/posts/source/links").set(as(userId)).send({ targetPostId });

test("linked posts list approved targets in the order they were linked", async () => {
  const { source, a, b, pending } = await seed();
  await link(source, b);
  await link(source, pending);
  await link(source, a);

  const res = await request(ctx.app).get("/api/posts/source/links");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((p) => p.id), ["b", "a"]);
});

test("the author or a moderator can link posts; anyone else can't", async () => {
  await seed();
  assert.equal((await add("author", "a")).status, 204);
  assert.equal((await add("mod", "b")).status, 204);

  const denied = await add("other", "a");
  assert.equal(denied.status, 403);
  assert.deepEqual(denied.body, { error: "Forbidden" });

  assert.equal(await prisma.postLink.count(), 2);
});

test("linking validates the target", async () => {
  await seed();
  const cases = [
    [undefined, "targetPostId is required"],
    ["source", "A post can't be linked to itself"],
    ["pending", "Target post not found"],
    ["nope", "Target post not found"],
  ];
  for (const [targetPostId, error] of cases) {
    const res = await add("author", targetPostId);
    assert.equal(res.status, 400, error);
    assert.deepEqual(res.body, { error });
  }
});

test("linking the same post twice is harmless", async () => {
  await seed();
  await add("author", "a");
  assert.equal((await add("author", "a")).status, 204);
  assert.equal(await prisma.postLink.count(), 1);
});

test("unlinking removes the link and is idempotent", async () => {
  const { source, a } = await seed();
  await link(source, a);
  const remove = (userId) => request(ctx.app).delete("/api/posts/source/links/a").set(as(userId));

  assert.equal((await remove("other")).status, 403);
  assert.equal((await remove("author")).status, 204);
  assert.equal(await prisma.postLink.count(), 0);
  assert.equal((await remove("author")).status, 204);
});
