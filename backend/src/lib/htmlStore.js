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
