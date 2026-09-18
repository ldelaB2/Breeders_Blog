// Serves the SPA shell for /posts/:id (rewritten here by vercel.json) with
// the post's own title, description, Open Graph tags and structured data
// filled in. Social scrapers and non-JS crawlers never run the React app,
// so without this every shared post link would unfurl as the generic site
// card. The browser still boots the normal app from this HTML; useSeo then
// writes the same values into the same tags.
import { postSeo, SITE_NAME } from "../src/lib/seo.js";

const API = process.env.VITE_API_BASE_URL;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Rewrites the value of the one index.html tag matching `attr`, e.g.
// setTag(html, 'property="og:title"', "content", ...).
const setTag = (html, attr, valueAttr, value) =>
  html.replace(new RegExp(`(<[^>]*${attr}[^>]*${valueAttr}=")[^"]*(")`), `$1${escapeHtml(value)}$2`);

export default async function handler(req, res) {
  const origin = `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers.host}`;
  const [shell, post] = await Promise.all([
    fetch(`${origin}/index.html`).then((r) => r.text()),
    fetch(`${API}/posts/${encodeURIComponent(req.query.id)}?html=0`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  // Unknown (or not yet approved) post: a real 404 for crawlers. The app
  // still loads and, for the author or a moderator, fetches it with their
  // own session.
  if (!post) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(404).send(setTag(shell, 'name="robots"', "content", "noindex"));
  }

  const { title, description, path, type, jsonLd } = postSeo(post, origin);
  const fullTitle = `${title} — ${SITE_NAME}`;
  const url = `${origin}${path}`;
  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);
  html = setTag(html, 'name="description"', "content", description);
  html = setTag(html, 'rel="canonical"', "href", url);
  html = setTag(html, 'property="og:title"', "content", fullTitle);
  html = setTag(html, 'property="og:description"', "content", description);
  html = setTag(html, 'property="og:url"', "content", url);
  html = setTag(html, 'property="og:type"', "content", type);
  // "<" is escaped so a title containing "</script>" can't end the block early.
  const json = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  html = html.replace("</head>", `<script type="application/ld+json">${json}</script></head>`);

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  res.send(html);
}
