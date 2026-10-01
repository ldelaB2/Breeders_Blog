// Pre-launch cleanup: empties every table in the Prisma schema (users,
// posts, comments, votes, pins, links, upload tickets - every model, found
// from the schema itself so a new model is never missed) and every Supabase
// Storage bucket (stitched HTML, authors' raw .md/.qmd/.zip uploads, share
// images). The schema and migration history are left alone, so the app
// keeps working against the now-empty database.
//
// User rows are re-created lazily the next time each person signs back in
// (see resolveUser in src/middleware/auth.js) or via Clerk's user.created
// webhook, with their role re-read from Clerk's privateMetadata - nothing
// needs to be manually re-imported. Clerk accounts themselves are untouched.
//
// Deliberately NOT wired into package.json scripts and NOT run automatically
// by anything - this is destructive and irreversible. Take a Supabase
// database backup before running it for real (Supabase dashboard -> Database
// -> Backups, or `pg_dump`).
//
// Usage (reads backend/.env, so it hits whatever database that points at):
//   node scripts/reset-for-launch.js            # dry run - reports what it WOULD do, changes nothing
//   node scripts/reset-for-launch.js --confirm   # actually deletes everything
import "dotenv/config";
import { pathToFileURL } from "node:url";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma.js";
import { defaultDeps } from "../src/deps.js";
import { env } from "../src/config/env.js";

// Every model in schema.prisma, as its Prisma client delegate name and its
// table name.
const MODELS = Prisma.dmmf.datamodel.models.map((m) => ({
  delegate: m.name[0].toLowerCase() + m.name.slice(1),
  table: m.dbName ?? m.name,
}));

const BUCKETS = ["html", "upload", "image"];

// The whole reset, with its storage passed in so tests/resetForLaunch.test.js
// can run it against the local test database and fake buckets.
export async function resetForLaunch({ stores, confirm, log = console.log }) {
  const [rowCounts, files] = await Promise.all([
    Promise.all(MODELS.map((m) => prisma[m.delegate].count())),
    Promise.all(BUCKETS.map((b) => stores[b].listAll())),
  ]);

  log("Current contents (all of this gets permanently deleted):");
  MODELS.forEach((m, i) => log(`  ${m.table.padEnd(20)} ${rowCounts[i]} row(s)`));
  BUCKETS.forEach((b, i) => log(`  ${`${b} bucket`.padEnd(20)} ${files[i].length} file(s)`));

  if (!confirm) {
    log("\nDry run only - nothing was deleted. Re-run with --confirm to actually apply this.");
    return;
  }

  log("\n--confirm passed - wiping now...");
  // One TRUNCATE over every table at once: atomic, and since every table
  // that references another is in the list, no foreign key (including the
  // Restrict ones on Comment.parentId and the user relations) can block it.
  const tables = MODELS.map((m) => `"${m.table}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);

  const remaining = (await Promise.all(MODELS.map((m) => prisma[m.delegate].count()))).reduce((a, b) => a + b, 0);
  log(`DB done. ${remaining} row(s) remain across ${MODELS.length} tables.`);
  for (const b of BUCKETS) log(`${b} bucket done. Deleted ${await stores[b].removeAll()} file(s).`);
}

// Supabase lists a bucket that doesn't exist as empty rather than erroring,
// so a missing bucket env var would silently skip that bucket.
const BUCKET_ENV = {
  SUPABASE_STORAGE_BUCKET: env.htmlBucket,
  SUPABASE_UPLOAD_BUCKET: env.uploadBucket,
  SUPABASE_IMAGE_BUCKET: env.imageBucket,
};

// Run directly (not imported by the test).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const missing = Object.keys(BUCKET_ENV).filter((name) => !BUCKET_ENV[name]);
  if (missing.length) {
    console.error(`Missing ${missing.join(", ")} in .env - refusing to run, or those buckets would be skipped.`);
    process.exit(1);
  }
  resetForLaunch({ stores: defaultDeps().stores, confirm: process.argv.includes("--confirm") })
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
