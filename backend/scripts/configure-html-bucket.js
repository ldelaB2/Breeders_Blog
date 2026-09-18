// One-time infra setup: restricts the post-html Supabase Storage bucket to
// only accept text/html uploads, enforced by Supabase Storage itself (not
// just the admin UI's client-side extension check, which a direct API call
// could bypass). Safe to re-run - updateBucket() is idempotent.
//
// Usage:
//   node scripts/configure-html-bucket.js
import "dotenv/config";
import { restrictHtmlBucketToHtml } from "../src/lib/htmlStore.js";

restrictHtmlBucketToHtml()
  .then(() => {
    console.log(`post-html bucket (${process.env.SUPABASE_STORAGE_BUCKET}) now only accepts text/html uploads.`);
  })
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
