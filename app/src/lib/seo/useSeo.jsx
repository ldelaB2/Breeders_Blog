import { useEffect } from "react";
import { SITE_NAME, SITE_DESCRIPTION } from "./seo";

// Fills in the page's <title>, description, canonical, Open Graph and
// robots tags for the current route. index.html always holds exactly one
// of each with the site defaults, and api/post.js pre-fills the same ones
// server-side for post pages, so this only ever rewrites their values
// rather than adding tags. Pass null while the page's data is still
// loading to leave whatever is there untouched.
export function useSeo(opts) {
  const ready = Boolean(opts);
  const { title, description = SITE_DESCRIPTION, path, type = "website", noindex = false, jsonLd } = opts ?? {};
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    if (!ready) return;
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    const url = `${window.location.origin}${path ?? window.location.pathname}`;
    const set = (selector, attr, value) => document.head.querySelector(selector)?.setAttribute(attr, value);

    document.title = fullTitle;
    set('meta[name="description"]', "content", description);
    set('meta[name="robots"]', "content", noindex ? "noindex" : "index,follow");
    set('link[rel="canonical"]', "href", url);
    set('meta[property="og:title"]', "content", fullTitle);
    set('meta[property="og:description"]', "content", description);
    set('meta[property="og:url"]', "content", url);
    set('meta[property="og:type"]', "content", type);

    let script = document.head.querySelector('script[type="application/ld+json"]');
    if (jsonLdText) {
      script ??= document.head.appendChild(document.createElement("script"));
      script.type = "application/ld+json";
      script.textContent = jsonLdText;
    } else {
      script?.remove();
    }
  }, [ready, title, description, path, type, noindex, jsonLdText]);
}
