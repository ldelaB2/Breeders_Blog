import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma, useTestApp } from "./setup/harness.js";
import { createComment, createPost, createUser, link, pin, vote } from "./setup/factories.js";
import { resetForLaunch } from "../scripts/reset-for-launch.js";
import { MODELS } from "../src/lib/db/models.js";

const ctx = useTestApp();

async function seed() {
  const author = await createUser();
  const post = await createPost({ author, id: "p1" });
  const other = await createPost({ author, id: "p2" });
  const parent = await createComment({ post, author });
  await createComment({ post, author, parentId: parent.id }); // a reply: Comment.parentId is ON DELETE RESTRICT
  await vote(post, author, 1);
  await pin(post, author);
  await link(post, other);
  await prisma.pendingPostUpload.create({ data: { id: "p3", authorId: author.id, rawSlug: "p3/upload.md" } });
  ctx.stores.html.put("p1.html", "<p/>");
  ctx.stores.upload.put("p1/upload.md", "#");
  ctx.stores.image.put("p1/share.png", "png");
}

test("the reset script's dry run reports counts and deletes nothing", async () => {
  await seed();
  const lines = [];
  await resetForLaunch({ stores: ctx.stores, confirm: false, log: (line) => lines.push(line) });

  assert.ok(lines.includes(`  ${"PostMetadata".padEnd(20)} 2 row(s)`));
  assert.ok(lines.includes(`  ${"html bucket".padEnd(20)} 1 file(s)`));
  assert.equal(await prisma.postMetadata.count(), 2);
  assert.equal(ctx.stores.html.objects.size, 1);
});

test("the reset script with confirm wipes the database and every bucket", async () => {
  await seed();
  await resetForLaunch({ stores: ctx.stores, confirm: true, log: () => {} });

  for (const { delegate, table } of MODELS) {
    assert.equal(await prisma[delegate].count(), 0, `${table} should be empty`);
  }
  assert.equal(ctx.stores.html.objects.size, 0);
  assert.equal(ctx.stores.upload.objects.size, 0);
  assert.equal(ctx.stores.image.objects.size, 0);
});
