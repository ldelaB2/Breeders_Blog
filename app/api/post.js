// Serves the SPA shell for /posts/:id (rewritten here by vercel.json) with
// the post's own title, description, Open Graph tags and structured data
// filled in. Social scrapers and non-JS crawlers never run the React app,
// so without this every shared post link would unfurl as the generic site
// card. The browser still boots the normal app from this HTML; useSeo then
// writes the same values into the same tags.
import { postSeo, postUrl, SITE_NAME } from "../src/lib/seo/seo.js";

const API = process.env.VITE_API_BASE_URL;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Every replace() below that inserts post text passes a function, never a
// string: in a replacement string "$1", "$&", "$'" etc. are expanded, so a
// title containing "$2" would turn back into a raw `"` after escaping.

// Rewrites the value of the one index.html tag matching `attr`, e.g.
// setTag(html, 'property="og:title"', "content", ...).
const setTag = (html, attr, valueAttr, value) =>
  html.replace(
    new RegExp(`(<[^>]*${attr}[^>]*${valueAttr}=")[^"]*(")`),
    (_, open, close) => `${open}${escapeHtml(value)}${close}`,
  );

export default async function handler(req, res) {
  const origin = `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers.host}`;
  const [shell, postRes] = await Promise.all([
    fetch(`${origin}/index.html`)
      .then((r) => (r.ok ? r.text() : null))
      .catch(() => null),
    fetch(`${API}/posts/${encodeURIComponent(req.query.id)}?html=0`).catch(() => null),
  ]);

  res.setHeader("Cache-Control", "no-store");

  // Without the shell there's no page to serve. A 503 tells crawlers to
  // come back later rather than treating the post as broken.
  if (shell == null) {
    res.setHeader("Retry-After", "60");
    return res.status(503).send("Service temporarily unavailable");
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  // Unknown (or not yet approved) post - the API answers 404 for both: a
  // real 404 for crawlers. The app still loads and, for the author or a
  // moderator, fetches it with their own session.
  if (postRes?.status === 404) {
    return res.status(404).send(setTag(shell, 'name="robots"', "content", "noindex"));
  }

  // The API errored or couldn't be reached: serve the plain shell rather
  // than tell crawlers a live post is gone. The app still loads the post
  // itself.
  const post = postRes?.ok ? await postRes.json().catch(() => null) : null;
  if (!post) return res.send(shell);

  const { title, description, type, image, jsonLd } = postSeo(post, origin);
  const fullTitle = `${title} — ${SITE_NAME}`;
  const url = postUrl(post, origin);
  let html = shell.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(fullTitle)}</title>`);
  html = setTag(html, 'name="description"', "content", description);
  html = setTag(html, 'rel="canonical"', "href", url);
  // The bare title: previews already show the site name (og:site_name) and domain.
  html = setTag(html, 'property="og:title"', "content", title);
  html = setTag(html, 'property="og:description"', "content", description);
  html = setTag(html, 'property="og:url"', "content", url);
  html = setTag(html, 'property="og:type"', "content", type);
  if (image) {
    html = setTag(html, 'property="og:image"', "content", image);
    html = setTag(html, 'property="og:image:alt"', "content", title);
    html = setTag(html, 'name="twitter:card"', "content", "summary_large_image");
  }
  // "<" is escaped so a title containing "</script>" can't end the block early.
  const json = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  html = html.replace("</head>", () => `<script type="application/ld+json">${json}</script></head>`);

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  res.send(html);
}
