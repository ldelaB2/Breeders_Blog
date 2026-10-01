// Input limits the API enforces. The frontend mirrors the user-facing ones
// (app/src/components/post/CreatePostModal.jsx) for fast feedback; these are
// the real enforcement.
export const TITLE_MAX = 100;
export const ABSTRACT_MAX = 3800;
export const REJECTION_REASON_MAX = 1000;
export const COMMENT_MAX = 5000;
export const SEARCH_WORDS_MAX = 10;

// Per-user submission cap across all statuses, so the moderation queue can't
// be spammed with pending/rejected posts either.
export const POST_LIMIT = 5;
export const POST_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// The only file types a raw upload may be, keyed by lowercased extension
// (parsed from the filename - browsers report inconsistent MIME types for
// .md/.qmd/.rmd) to the content-type sent on the PUT.
export const UPLOAD_TYPES = {
  md: "text/markdown",
  qmd: "text/markdown",
  rmd: "text/markdown",
  zip: "application/zip",
};

// The only types a share image may be, same keying as UPLOAD_TYPES. No SVG:
// the post-image bucket is public, and an SVG can carry script.
export const IMAGE_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

// Default and maximum `?limit=` for the list endpoints that take one.
export const TOP_POSTS_LIMIT = { fallback: 5, max: 20 };
export const RECOMMENDATIONS_LIMIT = { fallback: 6, max: 20 };
