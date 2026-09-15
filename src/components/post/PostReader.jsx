import { useState, useEffect, useMemo, useRef } from "react";
import Icon from "../Icon";
import CommentSection from "../comment/CommentSection";
import { fetchPost } from "../../lib/api";
import backArrowIcon from "../../assets/backarrow.svg?raw";

const DEFAULT_TITLE = "Breeders Blog";
const DEFAULT_DESCRIPTION =
  "Breeders Blog — research and notes on genomic selection, quantitative genetics, and modern breeding methods.";

// Turns arbitrary heading text into a stable, id-safe slug: lowercase,
// non-alphanumeric runs collapse to one hyphen, edges trimmed. Falls back
// to a positional placeholder for headings with no usable text.
function slugify(text, index) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `section-${index + 1}`;
}

// Table-of-contents entries, one per <h2> in the moderator-stitched HTML,
// plus that same HTML with a stable id written onto any <h2> that didn't
// already have one. Both come from one DOMParser pass over one DOM so they
// can never drift apart - goToSection looks ids up inside the rendered
// iframe's contentDocument, so an id that only existed in a JS array (and
// not in the srcDoc markup) would silently fail to scroll. Generated ids
// are de-duped against every id already in the document so they never
// collide with a moderator-typed one (e.g. id="overview").
function processHtml(html) {
  if (!html) return { html, sections: [] };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const usedIds = new Set([...doc.querySelectorAll("[id]")].map((el) => el.id));
  const sections = [];

  [...doc.querySelectorAll("h2")].forEach((heading, index) => {
    let id = heading.id;
    if (!id) {
      const base = slugify(heading.textContent, index);
      id = base;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${base}-${suffix}`;
        suffix += 1;
      }
      heading.id = id;
      usedIds.add(id);
    }
    sections.push({ id, text: heading.textContent });
  });

  return { html: doc.body.innerHTML, sections };
}

// A single post's page, reached at /posts/:id. Fetches its own detail
// (including the moderator-stitched HTML, which list endpoints omit) by id.
function PostReader({ postId, onBack }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [iframeHeight, setIframeHeight] = useState(0);
  const iframeRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const { html: postHtml, sections } = useMemo(() => processHtml(post?.html), [post?.html]);

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

  // The iframe has "allow-same-origin" (but never "allow-scripts" - the post
  // still can't run a single line of its own JS) purely so the parent can
  // read its rendered content: measuring its real height so it never needs
  // its own scrollbar, and locating headings to scroll to.
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
      <div className="mb-6 flex items-center gap-4 border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="shrink-0 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Icon svg={backArrowIcon} className="h-6 w-6" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-xl font-bold text-gray-900">
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
          <div className="flex gap-8">
            {sections.length > 1 && (
              <nav className="sticky top-1/2 hidden w-48 shrink-0 self-start -translate-y-1/2 md:block">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  On this page
                </p>
                <ul className="flex flex-col gap-1 border-l border-gray-200">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => goToSection(s.id)}
                        className="block w-full truncate border-l-2 border-transparent px-3 py-1 text-left text-sm text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
                      >
                        {s.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div className="min-w-0 flex-1">
              <p className="border-b border-gray-200 pb-4 text-sm text-gray-600">
                {post.abstract}
              </p>

              {post.html ? (
                // "allow-same-origin" only, never "allow-scripts": the post
                // still can't run a single line of JS, submit forms, or do
                // anything else active - it's untrusted content. That flag
                // just lets *our* code read the rendered page (see
                // handleIframeLoad/goToSection) so it can size the iframe
                // to fit and scroll to a heading.
                <iframe
                  ref={iframeRef}
                  onLoad={handleIframeLoad}
                  title={post.title}
                  srcDoc={postHtml}
                  sandbox="allow-same-origin"
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
