export function extensionOf(filename) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename ?? "");
  return match ? match[1].toLowerCase() : null;
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
