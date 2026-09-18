import { storage } from "./storage.js";

// Authors' raw post uploads (.md/.qmd/.rmd/.zip), keyed by PostBody.rawSlug
// ("<postId>/upload.<ext>"). The bucket's 50mb file size limit is set once in
// the Supabase dashboard, see README.
const bucket = () => storage.from(process.env.SUPABASE_UPLOAD_BUCKET);

export async function downloadRawUpload(rawSlug) {
  const { data, error } = await bucket().download(rawSlug);
  if (error) throw error;
  return data;
}

// A short-lived signed PUT URL the author's browser uploads directly to
// Supabase Storage with - bypasses Vercel's ~4.5mb function request-body
// cap, needed since raw uploads are allowed up to 50mb. upsert: true so a
// retried upload after a network blip reuses the same slug.
export async function createRawUploadUrl(rawSlug) {
  const { data, error } = await bucket().createSignedUploadUrl(rawSlug, { upsert: true });
  if (error) throw error;
  return data.signedUrl;
}

// Storage-reported size in bytes of an uploaded object, or null if it
// doesn't exist - never trust a client-claimed file size.
export async function getRawUploadSize(rawSlug) {
  const [folder, name] = rawSlug.split("/");
  const { data, error } = await bucket().list(folder, { search: name });
  if (error) throw error;
  const file = data?.find((f) => f.name === name);
  return file ? (file.metadata?.size ?? null) : null;
}

export async function deleteRawUpload(rawSlug) {
  if (!rawSlug) return;
  await bucket().remove([rawSlug]);
}
