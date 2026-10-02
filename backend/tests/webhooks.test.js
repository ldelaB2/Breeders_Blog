import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { Webhook } from "svix";
import { prisma, useTestApp } from "./setup/harness.js";
import { createUser } from "./setup/factories.js";

const ctx = useTestApp();

// Posts `event` to the Clerk webhook, signed the way Clerk (via svix) signs it.
function deliver(event, { secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET } = {}) {
  const payload = JSON.stringify(event);
  const id = `msg_${Math.random().toString(36).slice(2)}`;
  const timestamp = new Date();
  const signature = new Webhook(secret).sign(id, timestamp, payload);
  return request(ctx.app)
    .post("/api/webhooks/clerk")
    .set({
      "Content-Type": "application/json",
      "svix-id": id,
      "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "svix-signature": signature,
    })
    .send(payload);
}

const clerkUser = (overrides = {}) => ({
  id: "user_1",
  first_name: "Ada",
  last_name: "Lovelace",
  username: "ada",
  image_url: "https://img.test/ada.png",
  private_metadata: {},
  primary_email_address_id: "e2",
  email_addresses: [
    { id: "e1", email_address: "old@example.com" },
    { id: "e2", email_address: "ada@example.com" },
  ],
  ...overrides,
});

test("a badly signed webhook is rejected", async () => {
  const res = await deliver({ type: "user.created", data: clerkUser() }, { secret: "whsec_d3Jvbmctc2VjcmV0LXdyb25nLXNlY3JldA==" });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Invalid webhook signature" });
  assert.equal(await prisma.user.count(), 0);
});

test("user.created stores the user with their primary email", async () => {
  const res = await deliver({ type: "user.created", data: clerkUser({ private_metadata: { role: "ADMIN" } }) });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { received: true });

  const user = await prisma.user.findUnique({ where: { id: "user_1" } });
  assert.equal(user.name, "Ada Lovelace");
  assert.equal(user.role, "ADMIN");
  assert.equal(user.email, "ada@example.com");
  assert.equal(user.avatarUrl, "https://img.test/ada.png");
});

test("user.updated overwrites the stored user, whitelisting the role", async () => {
  await createUser({ id: "user_1", role: "MODERATOR", name: "Old" });
  await deliver({
    type: "user.updated",
    data: clerkUser({ first_name: null, last_name: null, private_metadata: { role: "GOD" } }),
  });

  const user = await prisma.user.findUnique({ where: { id: "user_1" } });
  assert.equal(user.name, "ada"); // falls back to the username
  assert.equal(user.role, "USER");
});

test("user.deleted forgets the user's email and role but keeps the row", async () => {
  await createUser({ id: "user_1", role: "ADMIN", email: "ada@example.com" });
  await createUser({ id: "user_2", role: "ADMIN", email: "bob@example.com" });
  const res = await deliver({ type: "user.deleted", data: { id: "user_1", object: "user", deleted: true } });
  assert.equal(res.status, 200);

  const user = await prisma.user.findUnique({ where: { id: "user_1" } });
  assert.deepEqual([user.email, user.role], [null, "USER"]);
  const other = await prisma.user.findUnique({ where: { id: "user_2" } });
  assert.deepEqual([other.email, other.role], ["bob@example.com", "ADMIN"]);

  // No id never becomes "every user".
  await deliver({ type: "user.deleted", data: { object: "user", deleted: true } });
  assert.equal((await prisma.user.findUnique({ where: { id: "user_2" } })).role, "ADMIN");
});

test("other event types are acknowledged and ignored", async () => {
  const res = await deliver({ type: "session.created", data: { id: "sess_1" } });
  assert.equal(res.status, 200);
  assert.equal(await prisma.user.count(), 0);
});
