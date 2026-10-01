import { postPath } from "../../../lib/seo";

// The one place the "shareable link for a post" formula lives — every
// provider calls this instead of re-deriving origin + path itself.
export function postShareUrl(post, origin) {
  return `${origin}${postPath(post)}`;
}
