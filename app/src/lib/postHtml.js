// Recursively walks a Quarto TOC's nested <ul>/<li> structure into
// {id, text, children}[], following each entry's real anchor target so a
// click can never point somewhere the body doesn't have an id for.
function parseTocList(ulEl) {
  const items = [];
  for (const li of ulEl.children) {
    if (li.tagName !== "LI") continue;
    const link = li.querySelector(":scope > a");
    if (!link) continue;

    const href = link.getAttribute("href") || "";
    const id = href.startsWith("#") ? href.slice(1) : (link.dataset.scrollTarget || "").replace(/^#/, "");
    if (!id) continue;

    const nestedUl = li.querySelector(":scope > ul");
    items.push({ id, text: link.textContent.trim(), children: nestedUl ? parseTocList(nestedUl) : [] });
  }
  return items;
}

// Quarto normally intercepts same-page anchor clicks (TOC entries,
// footnotes, cross-references) itself via quarto.js/tabsets.js - but those
// load from a relative "libs/" path that isn't there once only the single
// .html file is uploaded (no accompanying _files folder), so on a
// non-self-contained export that JS silently never loads. Without it, any
// stray `href="#..."` link left in the body falls through to a plain
// browser navigation - and because the iframe's srcDoc content resolves
// hrefs against the PARENT page's URL, that navigation hits the real
// app URL and 404s inside the content area. This listener is our own
// unconditional safety net: whatever the reason Quarto's own handling
// didn't run, no in-page anchor click inside the iframe can ever escape
// into a real navigation.
const ANCHOR_GUARD_SCRIPT = `
document.addEventListener("click", function (event) {
  var link = event.target.closest('a[href^="#"]');
  if (!link) return;
  event.preventDefault();
  var id = decodeURIComponent(link.getAttribute("href").slice(1));
  var target = id && document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
});
`;

// Pulls the moderator-stitched HTML's own Quarto-generated TOC nav (if any)
// out of the document so it isn't rendered a second time inside the iframe,
// and returns it as {id, text, children}[] for the app's own sidebar.
// Serializes the FULL document (not just <body>) - the old body-only
// extraction silently dropped <head>, which is where Quarto/htmlwidgets
// often put library script/style tags that now actually need to run.
export function extractPostHtml(html) {
  if (!html) return { html, toc: [] };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const container = doc.querySelector("#quarto-margin-sidebar") || doc.querySelector("nav#TOC");

  let toc = [];
  if (container) {
    const navEl = container.matches("nav#TOC") ? container : container.querySelector("nav#TOC");
    const topUl = navEl?.querySelector(":scope > ul");
    toc = topUl ? parseTocList(topUl) : [];
    container.remove(); // strip it even if empty/malformed - never leak into the iframe
  }

  const guardScript = doc.createElement("script");
  guardScript.textContent = ANCHOR_GUARD_SCRIPT;
  doc.body.appendChild(guardScript);

  const doctype = doc.doctype ? "<!doctype html>" : "";
  return { html: doctype + doc.documentElement.outerHTML, toc };
}
