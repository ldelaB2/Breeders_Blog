import { HttpError } from "../../lib/http/httpError.js";
import { env } from "../../config/env.js";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_UPLOAD_BYTES, UPLOAD_TYPES } from "../../config/limits.js";

// A post's files in storage, one bucket each (deps.stores):
//   upload  the author's raw .md/.qmd/.rmd/.zip     "<postId>/upload.<ext>"
//   html    the moderator-stitched HTML              "<postId>.html"
//   image   the optional share image (og:image)      "<postId>/share.<ext>"
// None passes through the API: the browser PUTs each one straight to its
// bucket through a signed URL, then a second request names the slug and
// the route confirms it landed. The client's own filename never reaches a
// path - only a validated extension does.

// A filename's lowercased extension, or null. Only ever used to pick from a
// fixed list of types - never to build a path.
export function extensionOf(filename) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(typeof filename === "string" ? filename : "");
  return match ? match[1].toLowerCase() : null;
}

export const htmlSlugFor = (postId) => `${postId}.html`;

// The uploads whose type and size the API checks itself (the html bucket
// enforces text/html on its own). `name` is the object's base name.
const UPLOADS = {
  upload: {
    name: "upload",
    types: UPLOAD_TYPES,
    maxBytes: MAX_UPLOAD_BYTES,
    errors: {
      type: "File must be a .md, .qmd, .rmd, or .zip",
      missing: "Upload not found - try uploading again",
      tooLarge: "File is too large - uploads must be under 50 MB",
    },
  },
  image: {
    name: "share",
    types: IMAGE_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    errors: {
      type: "Share image must be a .png, .jpg, or .webp",
      missing: "Share image not found - try uploading again",
      tooLarge: "Share image is too large - images must be under 5 MB",
    },
  },
};

const slugFor = (kind, postId, ext) => `${postId}/${UPLOADS[kind].name}.${ext}`;

// Validates `filename`'s type for `kind` and names its object:
// { slug, contentType } (the content-type the browser sends on the PUT).
export function uploadSlug(kind, postId, filename) {
  const { types, errors } = UPLOADS[kind];
  const ext = extensionOf(filename);
  if (!ext || !types[ext]) throw new HttpError(400, errors.type);
  return { slug: slugFor(kind, postId, ext), contentType: types[ext] };
}

// uploadSlug plus the signed URL to PUT it to.
export async function mintUpload(store, kind, postId, filename) {
  const file = uploadSlug(kind, postId, filename);
  return { ...file, signedUrl: await store.signedUploadUrl(file.slug) };
}

// Whether `slug` is a name uploadSlug could have given this post - lets a
// route accept a slug from the client without it pointing anywhere else.
export const isUploadSlugFor = (kind, postId, slug) =>
  Object.keys(UPLOADS[kind].types).some((ext) => slug === slugFor(kind, postId, ext));

// Confirms a direct upload landed and is within its size cap - the
// storage-reported size, never a client-claimed one. `onTooLarge` runs
// before the 400, e.g. to discard an upload that can never be used.
export async function assertUploaded(store, kind, slug, { onTooLarge } = {}) {
  const { maxBytes, errors } = UPLOADS[kind];
  const size = await store.size(slug);
  if (size === null) throw new HttpError(400, errors.missing);
  if (size > maxBytes) {
    await onTooLarge?.();
    throw new HttpError(400, errors.tooLarge);
  }
}

// Removes whichever of a post's (or upload ticket's) files are named.
export async function removePostFiles(stores, { htmlSlug, rawSlug, imageSlug }) {
  await stores.html.remove(htmlSlug);
  await stores.upload.remove(rawSlug);
  await stores.image.remove(imageSlug);
}

// The post-image bucket is public: link-preview scrapers fetch og:image
// anonymously and cache it for days, so a signed URL would expire under
// them. Unguessable post ids keep pending posts' images effectively private.
export const imageUrlFor = (slug) =>
  slug ? `${env.supabaseUrl}/storage/v1/object/public/${env.imageBucket}/${slug}` : null;
