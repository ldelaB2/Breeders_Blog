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

test("a malformed or oversized JSON body is a 4xx, not a logged 500", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const send = (body) => request(ctx.app).post("/api/posts").set("Content-Type", "application/json").send(body);

  const malformed = await send("{ nope");
  assert.equal(malformed.status, 400);
  assert.ok(malformed.body.error);

  const oversized = await send(JSON.stringify({ text: "x".repeat(200 * 1024) }));
  assert.equal(oversized.status, 413);
  assert.equal(error.mock.callCount(), 0);
});
