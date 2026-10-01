import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { useTestApp } from "./setup/harness.js";
import { createPost, createUser } from "./setup/factories.js";

const ctx = useTestApp();

test("GET /api/health reports ok", async () => {
  const res = await request(ctx.app).get("/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
});

test("unknown routes are a JSON 404", async () => {
  const res = await request(ctx.app).get("/api/nope");
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: "Not found" });
});

test("unexpected errors become a generic 500 without leaking the message", async (t) => {
  t.mock.method(console, "error", () => {});
  const author = await createUser();
  const post = await createPost({ author });
  ctx.stores.html.text = async () => {
    throw new Error("storage exploded");
  };

  const res = await request(ctx.app).get(`/api/posts/${post.id}`);
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { error: "Internal server error" });
});
