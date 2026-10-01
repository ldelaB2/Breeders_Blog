import { HttpError } from "../../lib/http/httpError.js";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "../../config/limits.js";
import { extensionOf, imageSlugFor } from "./posts.repo.js";

// A post's optional share image (its og:image), uploaded the same way as
// the raw file and the stitched HTML: the browser PUTs it straight to the
// post-image bucket through a signed URL, then a second request names the
// slug it got back. Used by submit.routes.js (the author) and
// moderation.routes.js (an admin replacing it on approval).

// Validates the image's type and mints its signed upload URL.
export async function mintImageUpload(store, postId, filename) {
  const ext = extensionOf(filename);
  if (!ext || !IMAGE_TYPES[ext]) throw new HttpError(400, "Share image must be a .png, .jpg, or .webp");
  const slug = imageSlugFor(postId, ext);
  return { slug, signedUrl: await store.signedUploadUrl(slug), contentType: IMAGE_TYPES[ext] };
}

// Confirms the direct upload landed and is within the size cap - the
// storage-reported size, never a client-claimed one.
export async function assertImageUploaded(store, slug) {
  const size = await store.size(slug);
  if (size === null) throw new HttpError(400, "Share image not found - try uploading again");
  if (size > MAX_IMAGE_BYTES) throw new HttpError(400, "Share image is too large - images must be under 5 MB");
}
