// Pure helpers behind the page metadata - shared by the useSeo hook in the
// browser and api/post.js on the server, so it must stay free of React and
// DOM references. It's also the one .js file in src/, and must not import
// anything: Node loads it directly (no Vite), and can't read .jsx or
// resolve the "@/" alias.
export const SITE_NAME = "Breeders Blog";
export const SITE_DESCRIPTION =
  "Research and notes on genomic selection, quantitative genetics, and modern breeding methods.";
// The default og:image (index.html) for pages and posts without a share image.
export const SITE_IMAGE_PATH = "/logo.png";

// Search engines and social cards cut descriptions off around this length;
// abstracts can run to thousands of characters.
const DESCRIPTION_MAX = 160;

export function truncate(text, max = DESCRIPTION_MAX) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

// Where a post lives in the app. The slug is computed by the API from the
// title (backend/src/modules/posts/postUrl.js); PostPage routes on the id alone.
export const postPath = (post) => `/posts/${post.id}/${post.slug}`;

// The absolute, shareable link for a post (share buttons, canonical URL).
export const postUrl = (post, origin) => `${origin}${postPath(post)}`;

// Everything useSeo/api/post.js need to describe a post page.
export function postSeo(post, origin) {
  const path = postPath(post);
  const description = truncate(post.abstract);
  return {
    title: post.title,
    description,
    path,
    type: "article",
    // The post's own share image (backend serializes it as a public URL),
    // shown large in link previews; null falls back to the logo.
    image: post.imageUrl ?? null,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      author: { "@type": "Person", name: post.authorName },
      datePublished: post.createdAt,
      dateModified: post.updatedAt,
      mainEntityOfPage: postUrl(post, origin),
      ...(post.imageUrl && { image: post.imageUrl }),
    },
  };
}
