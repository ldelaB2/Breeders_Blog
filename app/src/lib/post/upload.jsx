export function extensionOf(filename) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename ?? "");
  return match ? match[1].toLowerCase() : null;
}

export const formatMB = (bytes) => `${Math.round(bytes / (1024 * 1024))} MB`;

// A post's optional share image - the picture shown when its link is shared
// on LinkedIn, Facebook or X. Mirrors IMAGE_TYPES/MAX_IMAGE_BYTES in
// backend/src/config/limits.js. Used by CreatePostModal and ApprovePostModal.
export const SHARE_IMAGE_RULES = {
  extensions: ["png", "jpg", "jpeg", "webp"],
  maxBytes: 5 * 1024 * 1024,
  typeLabel: "a .png, .jpg, or .webp image",
};
export const SHARE_IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";
export const SHARE_IMAGE_HINT =
  "Shown when the post is shared on LinkedIn, Facebook or X. Landscape, ideally 1200×630. PNG, JPG or WebP, up to 5 MB.";

// Client-side check before an upload so a wrong file fails fast with a clear
// message; the storage bucket/backend is the real enforcement. `typeLabel`
// finishes the sentence "choose ...", e.g. "an .html file". Returns an
// error message, or null when the file is fine.
export function validateFile(file, { extensions, maxBytes, typeLabel }) {
  const ext = extensionOf(file.name);
  if (!ext || !extensions.includes(ext)) {
    return `"${file.name}" isn't a supported file type - choose ${typeLabel}`;
  }
  if (maxBytes && file.size > maxBytes) {
    return `"${file.name}" is too large - files must be under ${formatMB(maxBytes)}`;
  }
  return null;
}

// PUTs a file straight from the browser to Supabase Storage via a signed
// URL the backend minted - the file never passes through our own server,
// so it isn't bounded by Vercel's ~4.5mb function request-body limit.
export async function uploadToSignedUrl(signedUrl, file, contentType) {
  const res = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType, "x-upsert": "true" },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}
