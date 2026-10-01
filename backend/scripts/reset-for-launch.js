// One-time pre-launch cleanup: wipes every post (and, via cascade, every
// PostBody/Vote/Pin/Comment/CommentVote tied to a post) and every User,
// leaving the database fully empty. Also empties both Supabase Storage
// buckets - the stitched HTML files and authors' raw .md/.qmd/.zip uploads -
// and any leftover PendingPostUpload tickets, since those live outside the
// Postgres cascade and wiped posts would otherwise leave orphans behind.
//
// User rows are re-created lazily the next time each person signs back in
// (see resolveUser in src/middleware/auth.js) or via Clerk's user.created
// webhook - nothing needs to be manually re-imported.
//
// Deliberately NOT wired into package.json scripts and NOT run automatically
// by anything - this is destructive and irreversible. Take a Supabase
// database backup before running it for real (Supabase dashboard -> Database
// -> Backups, or `pg_dump`).
//
// Usage:
//   node scripts/reset-for-launch.js            # dry run - reports what it WOULD do, changes nothing
//   node scripts/reset-for-launch.js --confirm   # actually deletes everything
import "dotenv/config";
import { pathToFileURL } from "node:url";
import { prisma } from "../src/lib/db/prisma.js";
import { defaultDeps } from "../src/deps.js";

// The whole reset, with its storage passed in so tests/resetForLaunch.test.js
// can run it against the local test database and fake buckets.
export async function resetForLaunch({ stores, confirm, log = console.log }) {
  const [users, posts, comments, votes, commentVotes, pins, pendingUploads, htmlFiles, rawFiles] = await Promise.all([
    prisma.user.count(),
    prisma.postMetadata.count(),
    prisma.comment.count(),
    prisma.vote.count(),
    prisma.commentVote.count(),
    prisma.pin.count(),
    prisma.pendingPostUpload.count(),
    stores.html.listAll(),
    stores.upload.listAll(),
  ]);

  log("Current DB counts (all of this gets permanently deleted):");
  log(`  users:            ${users}`);
  log(`  posts:            ${posts}`);
  log(`  comments:         ${comments}`);
  log(`  votes:            ${votes}`);
  log(`  comment votes:    ${commentVotes}`);
  log(`  pins:             ${pins}`);
  log(`  pending uploads:  ${pendingUploads}`);
  log(`  html bucket files: ${htmlFiles.length}`);
  log(`  upload bucket files: ${rawFiles.length}`);

  if (!confirm) {
    log("\nDry run only - nothing was deleted. Re-run with --confirm to actually apply this.");
    return;
  }

  log("\n--confirm passed - wiping now...");
  await prisma.$transaction([
    // Cascades away PostBody/Vote/Pin/Comment/CommentVote for every post.
    prisma.postMetadata.deleteMany({}),
    prisma.pendingPostUpload.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);

  const remainingUsers = await prisma.user.count();
  const remainingPosts = await prisma.postMetadata.count();
  log(`DB done. ${remainingUsers} user(s) and ${remainingPosts} post(s) remain.`);
  log(`HTML bucket done. Deleted ${await stores.html.removeAll()} file(s).`);
  log(`Upload bucket done. Deleted ${await stores.upload.removeAll()} file(s).`);
}

// Run directly (not imported by the test).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  resetForLaunch({ stores: defaultDeps().stores, confirm: process.argv.includes("--confirm") })
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
