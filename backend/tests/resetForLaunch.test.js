import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma, useTestApp } from "./setup/harness.js";
import { createComment, createPost, createUser } from "./setup/factories.js";
import { resetForLaunch } from "../scripts/reset-for-launch.js";

const ctx = useTestApp();

async function seed() {
  const author = await createUser();
  const post = await createPost({ author, id: "p1" });
  await createComment({ post, author });
  ctx.stores.html.put("p1.html", "<p/>");
  ctx.stores.upload.put("p1/upload.md", "#");
}

test("the reset script's dry run reports counts and deletes nothing", async () => {
  await seed();
  const lines = [];
  await resetForLaunch({ stores: ctx.stores, confirm: false, log: (line) => lines.push(line) });

  assert.ok(lines.includes("  posts:            1"));
  assert.ok(lines.includes("  html bucket files: 1"));
  assert.equal(await prisma.postMetadata.count(), 1);
  assert.equal(ctx.stores.html.objects.size, 1);
});

test("the reset script with confirm wipes the database and both buckets", async () => {
  await seed();
  await resetForLaunch({ stores: ctx.stores, confirm: true, log: () => {} });

  assert.equal(await prisma.user.count(), 0);
  assert.equal(await prisma.postMetadata.count(), 0);
  assert.equal(await prisma.comment.count(), 0);
  assert.equal(ctx.stores.html.objects.size, 0);
  assert.equal(ctx.stores.upload.objects.size, 0);
});
