import { StorageClient } from "@supabase/storage-js";

// Fetches/stores the moderator-stitched HTML in Supabase Storage by its key
// (PostBody.htmlSlug). Uses the storage-only client (not the full
// @supabase/supabase-js, which drags in a Realtime websocket dependency
// that breaks on Node 20) with the service role key so the backend can
// read/write the (private) bucket directly, bypassing RLS.
const client = new StorageClient(`${process.env.SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});
const Bucket = process.env.SUPABASE_STORAGE_BUCKET;

export async function getStitchedHtml(htmlSlug) {
  if (!htmlSlug) return null;
  const { data, error } = await client.from(Bucket).download(htmlSlug);
  if (error) return null;
  return await data.text();
}

// A short-lived signed PUT URL the browser uploads directly to Supabase
// Storage with - bypasses Vercel's ~4.5mb function request-body cap, which a
// large self-contained Quarto export (bundled Plotly.js, etc.) can exceed.
// upsert: true since re-approving after a prior approval reuses the same slug.
export async function createStitchedHtmlUploadUrl(htmlSlug) {
  const { data, error } = await client.from(Bucket).createSignedUploadUrl(htmlSlug, { upsert: true });
  if (error) throw error;
  return data.signedUrl;
}

// Confirms a direct upload actually landed before the approve route commits
// to it in the database - a signed-URL PUT that silently failed client-side
// (network blip, bucket size limit) would otherwise still get marked APPROVED.
export async function stitchedHtmlExists(htmlSlug) {
  const { data } = await client.from(Bucket).exists(htmlSlug);
  return Boolean(data);
}

export async function deleteStitchedHtml(htmlSlug) {
  if (!htmlSlug) return;
  await client.from(Bucket).remove([htmlSlug]);
}

// Lists every object in the bucket (paginated - list() defaults to 100 per
// page), not just ones a current PostBody.htmlSlug points at, so it also
// catches any orphaned uploads (e.g. from an approval that never completed).
// Used by scripts/reset-for-launch.js.
export async function listAllStitchedHtml() {
  const names = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const { data, error } = await client.from(Bucket).list(undefined, { limit, offset });
    if (error) throw error;
    if (data.length === 0) break;
    names.push(...data.map((f) => f.name));
    offset += data.length;
    if (data.length < limit) break;
  }
  return names;
}

// Restricts the bucket to accepting only text/html uploads - enforced by
// Supabase Storage itself against the PUT's Content-Type header, for both
// direct uploads and the signed URLs createStitchedHtmlUploadUrl mints, so a
// non-HTML file is rejected even if a caller bypasses the admin UI/API and
// PUTs straight to a signed URL. Idempotent; used by
// scripts/configure-html-bucket.js. See that script's comment for why this
// isn't just baked into deploy - it's a one-time bucket setting, not
// something that needs re-applying on every deploy.
export async function restrictHtmlBucketToHtml() {
  const { data, error } = await client.updateBucket(Bucket, { allowedMimeTypes: ["text/html"] });
  if (error) throw error;
  return data;
}

// Empties the whole bucket. Used by scripts/reset-for-launch.js.
export async function deleteAllStitchedHtml() {
  const names = await listAllStitchedHtml();
  // remove() takes a batch of paths - chunked so a very large bucket can't
  // hit a request size limit.
  for (let i = 0; i < names.length; i += 100) {
    const { error } = await client.from(Bucket).remove(names.slice(i, i + 100));
    if (error) throw error;
  }
  return names.length;
}
