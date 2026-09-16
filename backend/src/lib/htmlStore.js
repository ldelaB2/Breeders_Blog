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

export async function saveStitchedHtml(htmlSlug, html) {
  const { error } = await client
    .from(Bucket)
    .upload(htmlSlug, html, { contentType: "text/html", upsert: true });
  if (error) throw error;
}

export async function deleteStitchedHtml(htmlSlug) {
  if (!htmlSlug) return;
  await client.from(Bucket).remove([htmlSlug]);
}
