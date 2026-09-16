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

  const doctype = doc.doctype ? "<!doctype html>" : "";
  return { html: doctype + doc.documentElement.outerHTML, toc };
}
