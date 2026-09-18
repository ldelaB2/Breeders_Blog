import { StorageClient } from "@supabase/storage-js";

// Fetches/stores authors' raw post uploads (.md/.qmd/.zip) in Supabase
// Storage by their key (PostBody.rawSlug). Same client shape as
// htmlStore.js - the storage-only client (not the full @supabase/supabase-js,
// which drags in a Realtime websocket dependency that breaks on Node 20)
// with the service role key so the backend can read/write the (private)
// bucket directly, bypassing RLS. The bucket has no policies granting
// anon/authenticated access at all - only this service-role client, or the
// short-lived signed URLs it mints, can ever touch it.
const client = new StorageClient(`${process.env.SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});
const Bucket = process.env.SUPABASE_UPLOAD_BUCKET;

export async function downloadRawUpload(rawSlug) {
  const { data, error } = await client.from(Bucket).download(rawSlug);
  if (error) throw error;
  return data;
}

// A short-lived signed PUT URL the browser uploads directly to Supabase
// Storage with - bypasses Vercel's ~4.5mb function request-body cap, needed
// since raw uploads are allowed up to 50mb. upsert: true since a retried
// upload after a network blip reuses the same slug.
export async function createRawUploadUrl(rawSlug) {
  const { data, error } = await client.from(Bucket).createSignedUploadUrl(rawSlug, { upsert: true });
  if (error) throw error;
  return data.signedUrl;
}

// Confirms a direct upload actually landed, and returns its real
// storage-reported size, before the create route commits to it in the
// database - never trust a client-claimed file size. Returns null if the
// object doesn't exist.
export async function getRawUploadInfo(rawSlug) {
  const slashIndex = rawSlug.lastIndexOf("/");
  const folder = slashIndex === -1 ? "" : rawSlug.slice(0, slashIndex);
  const name = slashIndex === -1 ? rawSlug : rawSlug.slice(slashIndex + 1);
  const { data, error } = await client.from(Bucket).list(folder, { search: name });
  if (error) throw error;
  return data?.find((f) => f.name === name) ?? null;
}

export async function deleteRawUpload(rawSlug) {
  if (!rawSlug) return;
  await client.from(Bucket).remove([rawSlug]);
}

// Lists every object in the bucket (paginated - list() defaults to 100 per
// page), not just ones a current PostBody.rawSlug points at, so it also
// catches orphaned uploads (e.g. a signed-URL upload that never turned into
// a post). Used by scripts/reset-for-launch.js.
export async function listAllRawUploads() {
  const paths = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const { data: folders, error } = await client.from(Bucket).list(undefined, { limit, offset });
    if (error) throw error;
    if (folders.length === 0) break;
    for (const folder of folders) {
      const { data: files, error: listErr } = await client.from(Bucket).list(folder.name);
      if (listErr) throw listErr;
      paths.push(...files.map((f) => `${folder.name}/${f.name}`));
    }
    offset += folders.length;
    if (folders.length < limit) break;
  }
  return paths;
}

// Empties the whole bucket. Used by scripts/reset-for-launch.js.
export async function deleteAllRawUploads() {
  const paths = await listAllRawUploads();
  // remove() takes a batch of paths - chunked so a very large bucket can't
  // hit a request size limit.
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await client.from(Bucket).remove(paths.slice(i, i + 100));
    if (error) throw error;
  }
  return paths.length;
}
