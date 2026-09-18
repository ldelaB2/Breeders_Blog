import { storage } from "./storage.js";

// The moderator-stitched HTML for approved posts, keyed by PostBody.htmlSlug
// ("<postId>.html"). The bucket itself only accepts text/html uploads - set
// once in the Supabase dashboard, see README.
const bucket = () => storage.from(process.env.SUPABASE_STORAGE_BUCKET);

export async function getStitchedHtml(htmlSlug) {
  if (!htmlSlug) return null;
  const { data, error } = await bucket().download(htmlSlug);
  if (error) return null;
  return data.text();
}

// A short-lived signed PUT URL the admin's browser uploads directly to
// Supabase Storage with - bypasses Vercel's ~4.5mb function request-body
// cap, which a self-contained Quarto export (bundled Plotly.js etc.) can
// exceed. upsert: true since re-approving reuses the same slug.
export async function createStitchedHtmlUploadUrl(htmlSlug) {
  const { data, error } = await bucket().createSignedUploadUrl(htmlSlug, { upsert: true });
  if (error) throw error;
  return data.signedUrl;
}

// Confirms a direct upload actually landed before the approve route commits
// to it - a signed-URL PUT that failed client-side would otherwise still get
// marked APPROVED.
export async function stitchedHtmlExists(htmlSlug) {
  const { data } = await bucket().exists(htmlSlug);
  return Boolean(data);
}

export async function deleteStitchedHtml(htmlSlug) {
  if (!htmlSlug) return;
  await bucket().remove([htmlSlug]);
}
