import { useState, useEffect, useMemo, useRef } from "react";
import Icon from "../Icon";
import CommentSection from "../comment/CommentSection";
import { fetchPost } from "../../lib/api";
import { extractPostHtml } from "../../lib/postHtml";
import backArrowIcon from "../../assets/backarrow.svg?raw";

const DEFAULT_TITLE = "Breeders Blog";
const DEFAULT_DESCRIPTION =
  "Breeders Blog — research and notes on genomic selection, quantitative genetics, and modern breeding methods.";

// One "On this page" entry per TOC node, recursing into nested entries
// (Quarto nests h3s etc. under their parent h2) with deeper levels indented.
function TocList({ items, onSelect, depth = 0 }) {
  return (
    <ul
      className={
        depth === 0
          ? "flex flex-col gap-1 border-l border-canvas-border"
          : "ml-3 flex flex-col gap-1 border-l border-canvas-border"
      }
    >
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
  const resizeObserverRef = useRef(null);
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

  // Gives the post a unique tab title and meta description while it's open,
  // restoring the site defaults on the way out.
  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} — ${DEFAULT_TITLE}`;
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute("content", post.abstract);
    return () => {
      document.title = DEFAULT_TITLE;
      meta?.setAttribute("content", DEFAULT_DESCRIPTION);
    };
  }, [post]);

  // The iframe is unsandboxed (see the rationale on the iframe itself below),
  // so contentDocument is always readable here: measures the post's real
  // height so it never needs its own scrollbar, and re-measures on resize.
  function handleIframeLoad() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const measure = () => setIframeHeight(doc.documentElement.scrollHeight);
    measure();

    resizeObserverRef.current?.disconnect();
    const observer = new ResizeObserver(measure);
    observer.observe(doc.documentElement);
    resizeObserverRef.current = observer;
  }

  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  // Pushes the TOC nav's starting position down by half the abstract's
  // height, so it's anchored at the abstract's vertical center rather than
  // its top - mirroring how the nav is already naturally kept from
  // overlapping the comments below (it can't stick past the end of its
  // containing row).
  useEffect(() => {
    const el = abstractRef.current;
    if (!el) return;

    const measure = () => setNavOffset(el.offsetHeight / 2);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [post?.abstract]);

  // Only one scrollable area on the page (the outer window) - the iframe is
  // sized to fit all of its content, so "jumping" to a section means
  // scrolling the outer page to that heading's position, not the iframe.
  function goToSection(id) {
    const iframeEl = iframeRef.current;
    const heading = iframeEl?.contentDocument?.getElementById(id);
    if (!heading) return;

    const targetY =
      window.scrollY + iframeEl.getBoundingClientRect().top + heading.getBoundingClientRect().top - 16;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }

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
          <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl">
            {post?.title}
          </h1>
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  On this page
                </p>
                <TocList items={toc} onSelect={goToSection} />
              </nav>
            )}

            <div className="min-w-0 flex-1">
              <p ref={abstractRef} className="border-b border-canvas-border pb-4 text-sm text-gray-600">
                {post.abstract}
              </p>

              {post.html ? (
                // Deliberately unsandboxed: posts can include interactive
                // content (e.g. Plotly charts) whose scripts need to run.
                // This means an approved post's HTML has full same-origin
                // access to the app, so the only gate against a malicious
                // script is ADMIN-only moderation at approve time (see
                // requireRole("ADMIN") on POST /:id/approve) - there is no
                // server-side sanitization. Accepted tradeoff, not an
                // oversight.
                <iframe
                  ref={iframeRef}
                  onLoad={handleIframeLoad}
                  title={post.title}
                  srcDoc={postHtml}
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
