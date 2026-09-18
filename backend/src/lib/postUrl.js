// A post's public URL on the frontend. The slug is derived from the title
// on every read rather than stored: PostPage.jsx routes on the id alone, so
// the slug is purely for readers and search engines and can change freely.
export function slugify(title) {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "Résumé" -> "Resume"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

export const postUrl = (post) => `${process.env.SITE_URL}/posts/${post.id}/${slugify(post.title)}`;
