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

// Inside the sandbox (opaque origin) window.localStorage/sessionStorage
// throw a SecurityError on access. Quarto's own page scripts (theme toggle,
// tabsets) touch them, so this runs first and swaps in a harmless
// in-memory Storage rather than letting those scripts die mid-setup.
const STORAGE_SHIM = `
(function () {
  ["localStorage", "sessionStorage"].forEach(function (name) {
    try { window[name]; return; } catch (e) {}
    var store = new Map();
    Object.defineProperty(window, name, { configurable: true, value: {
      get length() { return store.size; },
      key: function (i) { return Array.from(store.keys())[i] ?? null; },
      getItem: function (k) { return store.has(String(k)) ? store.get(String(k)) : null; },
      setItem: function (k, v) { store.set(String(k), String(v)); },
      removeItem: function (k) { store.delete(String(k)); },
      clear: function () { store.clear(); },
    } });
  });
})();
`;

// Injected into every post so it can talk to PostReader across the sandbox
// boundary (the iframe has an opaque origin, so the parent can't read its
// document directly). Three messages:
//   iframe -> parent  { type: "post-height", height }  keep the iframe sized to its content
//   iframe -> parent  { type: "post-scroll", top }     scroll the page to a heading (top = offset within the iframe)
//   parent -> iframe  { type: "post-goto", id }        a TOC click in the app's sidebar
// In-page anchor clicks (footnotes, cross-refs, any stray href="#...") are
// handled here too: srcDoc content resolves hrefs against the parent's URL,
// so left alone they'd navigate the app to a 404.
const BRIDGE_SCRIPT = `
(function () {
  var send = function (msg) { window.parent.postMessage(msg, "*"); };
  var reportHeight = function () { send({ type: "post-height", height: document.documentElement.scrollHeight }); };
  var scrollTo = function (id) {
    var el = id && document.getElementById(id);
    if (el) send({ type: "post-scroll", top: el.getBoundingClientRect().top });
  };
  new ResizeObserver(reportHeight).observe(document.documentElement);
  window.addEventListener("load", reportHeight);
  window.addEventListener("message", function (event) {
    if (event.source === window.parent && event.data && event.data.type === "post-goto") scrollTo(event.data.id);
  });
  document.addEventListener("click", function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    event.preventDefault();
    scrollTo(decodeURIComponent(link.getAttribute("href").slice(1)));
  });
})();
`;

// Pulls the stitched HTML's own Quarto-generated TOC nav (if any) out of
// the document so it isn't rendered a second time inside the iframe,
// returns it as {id, text, children}[] for the app's sidebar, and injects
// the two scripts above. Serializes the full document, not just <body> -
// that's where Quarto/htmlwidgets put the script/style tags that need to run.
export function extractPostHtml(html) {
  if (!html) return { html, toc: [] };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const container = doc.querySelector("#quarto-margin-sidebar") || doc.querySelector("nav#TOC");

  let toc = [];
  if (container) {
    const navEl = container.matches("nav#TOC") ? container : container.querySelector("nav#TOC");
    const topUl = navEl?.querySelector(":scope > ul");
    toc = topUl ? parseTocList(topUl) : [];
    container.remove();
  }

  const script = (text) => Object.assign(doc.createElement("script"), { textContent: text });
  doc.head.prepend(script(STORAGE_SHIM));
  doc.body.appendChild(script(BRIDGE_SCRIPT));

  const doctype = doc.doctype ? "<!doctype html>" : "";
  return { html: doctype + doc.documentElement.outerHTML, toc };
}
