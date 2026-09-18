import { useState, useEffect, useMemo, useRef } from "react";
import Icon from "../Icon";
import CommentSection from "../comment/CommentSection";
import { fetchPost } from "../../lib/api";
import { extractPostHtml } from "../../lib/postHtml";
import { setCitation } from "../../lib/citation";
import { postSeo } from "../../lib/seo";
import { useSeo } from "../../lib/useSeo";
import backArrowIcon from "../../assets/backarrow.svg?raw";

// One "On this page" entry per TOC node, recursing into nested entries
// (Quarto nests h3s etc. under their parent h2) with deeper levels indented.
function TocList({ items, onSelect, depth = 0 }) {
  return (
    <ul className={`flex flex-col gap-1 border-l border-canvas-border ${depth > 0 ? "ml-3" : ""}`}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="block w-full truncate border-l-2 border-transparent px-3 py-1 text-left text-sm text-gray-600 transition-colors hover:border-accent hover:text-accent"
          >
            {item.text}
          </button>
          {item.children.length > 0 && <TocList items={item.children} onSelect={onSelect} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

// A single post's page, reached at /posts/:id. Fetches its own detail
// (including the moderator-stitched HTML, which list endpoints omit) by id.
function PostReader({ postId, onBack }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [iframeHeight, setIframeHeight] = useState(0);
  const [navOffset, setNavOffset] = useState(0);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const iframeRef = useRef(null);
  const abstractRef = useRef(null);
  const { html: postHtml, toc } = useMemo(() => extractPostHtml(post?.html), [post?.html]);

  useEffect(() => {
    // Reset before the new fetch resolves so a post switch never briefly
    // shows the previous post's content under the new title.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPost(null);
    setError(null);
    setIframeHeight(0);
    fetchPost(postId)
      .then(setPost)
      .catch((err) => setError(err.message));
  }, [postId]);

  // Page metadata and the footer's citation follow the open post (the
  // citation reverts on the way out; the next page sets its own metadata).
  useSeo(post ? postSeo(post, window.location.origin) : error ? { title: "Post not found", noindex: true } : null);
  useEffect(() => {
    if (!post) return;
    setCitation({ title: post.title, author: post.authorName, date: post.createdAt });
    return () => setCitation(null);
  }, [post]);

  // The iframe is sandboxed (see below), so the post talks to us via
  // postMessage (the bridge script in lib/postHtml.js): its content height,
  // so it never needs its own scrollbar, and "scroll to this heading"
  // requests. The page has a single scrollable area - the window - so a
  // jump means scrolling the window to the heading's absolute position.
  useEffect(() => {
    function onMessage(event) {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;
      const { type, height, top } = event.data ?? {};
      if (type === "post-height") setIframeHeight(height);
      if (type === "post-scroll") {
        window.scrollTo({ top: window.scrollY + iframe.getBoundingClientRect().top + top - 16, behavior: "smooth" });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function goToSection(id) {
    iframeRef.current?.contentWindow?.postMessage({ type: "post-goto", id }, "*");
  }

  // Pushes the TOC nav's starting position down by half the abstract's
  // height, so it's anchored at the abstract's vertical center rather than
  // its top (it can't stick past the end of its containing row, so it
  // already stays clear of the comments below).
  useEffect(() => {
    const el = abstractRef.current;
    if (!el) return;
    const measure = () => setNavOffset(el.offsetHeight / 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [post?.abstract]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4 border-b border-canvas-border pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="shrink-0 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Icon svg={backArrowIcon} className="h-6 w-6" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl">{post?.title}</h1>
          <p className="text-sm text-gray-500">{post?.authorName}</p>
        </div>
      </div>

      {error && <p className="py-4 text-sm text-red-600">{error}</p>}

      {!post && !error ? (
        <p className="py-4 text-sm text-gray-500">Loading…</p>
      ) : post ? (
        <>
          {toc.length > 1 && (
            <div className="mb-6 md:hidden">
              <button
                type="button"
                onClick={() => setMobileTocOpen((prev) => !prev)}
                aria-expanded={mobileTocOpen}
                className="flex w-full items-center justify-between rounded-md border border-canvas-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                On this page
                <svg
                  className={`h-4 w-4 transition-transform ${mobileTocOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {mobileTocOpen && (
                <div className="rounded-b-md border border-t-0 border-canvas-border px-4 py-3">
                  <TocList
                    items={toc}
                    onSelect={(id) => {
                      goToSection(id);
                      setMobileTocOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-8">
            {toc.length > 1 && (
              <nav
                className="sticky top-1/2 hidden w-48 shrink-0 self-start -translate-y-1/2 md:block"
                style={{ marginTop: navOffset }}
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">On this page</p>
                <TocList items={toc} onSelect={goToSection} />
              </nav>
            )}

            <div className="min-w-0 flex-1">
              <p ref={abstractRef} className="border-b border-canvas-border pb-4 text-sm text-gray-600">
                {post.abstract}
              </p>

              {post.html ? (
                // Sandboxed without allow-same-origin: the post's own
                // scripts (Plotly charts etc.) still run, but in an opaque
                // origin with no access to the app, its DOM, or the
                // viewer's Clerk session. Admin moderation is the first
                // gate; this is the second.
                <iframe
                  ref={iframeRef}
                  title={post.title}
                  srcDoc={postHtml}
                  sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  scrolling="no"
                  style={{ height: iframeHeight || 400 }}
                  className="w-full border-0"
                />
              ) : (
                <p className="px-6 py-8 text-center text-sm text-gray-500">
                  This post is still pending review, so there's no preview yet.
                </p>
              )}
            </div>
          </div>

          <CommentSection postId={post.id} locked={post.locked} />
        </>
      ) : null}
    </div>
  );
}

export default PostReader;
