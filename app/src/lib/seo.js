// Pure helpers behind the page metadata - shared by the useSeo hook in the
// browser and api/post.js on the server, so it must stay free of React and
// DOM references.
export const SITE_NAME = "Breeders Blog";
export const SITE_DESCRIPTION =
  "Research and notes on genomic selection, quantitative genetics, and modern breeding methods.";

// Search engines and social cards cut descriptions off around this length;
// abstracts can run to thousands of characters.
const DESCRIPTION_MAX = 160;

export function truncate(text, max = DESCRIPTION_MAX) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

// Where a post lives in the app. The slug is computed by the API from the
// title (backend/src/lib/postUrl.js); PostPage routes on the id alone.
export const postPath = (post) => `/posts/${post.id}/${post.slug}`;

// Everything useSeo/api/post.js need to describe a post page.
export function postSeo(post, origin) {
  const path = postPath(post);
  return {
    title: post.title,
    description: truncate(post.abstract),
    path,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: truncate(post.abstract),
      author: { "@type": "Person", name: post.authorName },
      datePublished: post.createdAt,
      dateModified: post.updatedAt,
      mainEntityOfPage: `${origin}${path}`,
    },
  };
}
