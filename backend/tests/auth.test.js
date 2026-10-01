import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { as, prisma, useTestApp } from "./setup/harness.js";
import { createUser } from "./setup/factories.js";

const ctx = useTestApp();

test("a missing or non-Bearer token is a 401", async () => {
  for (const headers of [{}, { Authorization: "Basic abc" }]) {
    const res = await request(ctx.app).get("/api/me").set(headers);
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { error: "Missing auth token" });
  }
});

test("a token Clerk rejects is a 401", async () => {
  const res = await request(ctx.app).get("/api/me").set({ Authorization: "Bearer junk" });
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: "Invalid auth token" });
});

test("a known user is read from the database", async () => {
  await createUser({ id: "ada", name: "Ada", role: "ADMIN" });
  const res = await request(ctx.app).get("/api/me").set(as("ada"));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { id: "ada", name: "Ada", role: "ADMIN" });
});

test("a new user is fetched from Clerk and stored", async () => {
  const res = await request(ctx.app).get("/api/me").set(as("newbie"));
  assert.deepEqual(res.body, { id: "newbie", name: "Test User", role: "USER" });

  const row = await prisma.user.findUnique({ where: { id: "newbie" } });
  assert.equal(row.email, "newbie@example.com");
  assert.equal(row.avatarUrl, "https://img.test/newbie.png");
});

test("a new user's role comes from Clerk private metadata, whitelisted", async () => {
  ctx.clerk.clerkUsers.set("mod", { privateMetadata: { role: "MODERATOR" } });
  ctx.clerk.clerkUsers.set("sneaky", { privateMetadata: { role: "SUPERUSER" } });

  assert.equal((await request(ctx.app).get("/api/me").set(as("mod"))).body.role, "MODERATOR");
  assert.equal((await request(ctx.app).get("/api/me").set(as("sneaky"))).body.role, "USER");
});

test("role-gated routes are a 403 for lesser roles", async () => {
  await createUser({ id: "u", role: "USER" });
  await createUser({ id: "m", role: "MODERATOR" });
  await createUser({ id: "a", role: "ADMIN" });

  for (const id of ["u", "m"]) {
    const res = await request(ctx.app).get("/api/posts/pending").set(as(id));
    assert.equal(res.status, 403);
    assert.deepEqual(res.body, { error: "Forbidden" });
  }
  assert.equal((await request(ctx.app).get("/api/posts/pending").set(as("a"))).status, 200);
});

test("optional-auth routes treat an invalid token as anonymous", async () => {
  const res = await request(ctx.app).get("/api/posts").set({ Authorization: "Bearer junk" });
  assert.equal(res.status, 200);
});
