// pages/Home.jsx's building block: a titled row of post tiles that scrolls
// horizontally. Used for Top Posts, Your Pinned Posts, and Recommended for
// You - each just passes a different fetcher, so the row itself doesn't
// know or care which one it's showing.
import { useEffect, useRef, useState } from "react";
import Post from "./Post";
import { useApi } from "../../lib/api";
import { usePostActions } from "../../lib/usePostActions";
import Icon from "../Icon";
import chevronIcon from "../../assets/chevron.svg?raw";

const SCROLL_AMOUNT = 400; // tile width (w-96 = 384px) + gap-4 (16px)

function PostCarousel({ title, fetchPosts, emptyMessage }) {
  const api = useApi();
  const scrollRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetchPosts(api)
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { onTogglePin, onUpvote, onDownvote } = usePostActions(setPosts, api, setError);

  // Wraps around at either end so repeatedly scrolling one direction cycles
  // through the row indefinitely instead of stopping at the last tile.
  function scroll(direction) {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (direction > 0 && el.scrollLeft >= maxScroll - 1) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (direction < 0 && el.scrollLeft <= 0) {
      el.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      el.scrollBy({ left: direction * SCROLL_AMOUNT, behavior: "smooth" });
    }
  }

  if (loading) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-gray-900">{title}</h2>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {posts.length === 0 ? (
        <p className="text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="relative px-12">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-canvas-border bg-white p-3 text-gray-500 shadow-sm transition-colors hover:bg-gray-100"
          >
            <Icon svg={chevronIcon} className="h-5 w-5 rotate-90" />
          </button>

          <div
            ref={scrollRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 py-2"
          >
            {posts.map((post) => (
              <div key={post.id} className="w-96 shrink-0 snap-start">
                <Post
                  post={post}
                  showTopic
                  onTogglePin={onTogglePin}
                  onUpvote={onUpvote}
                  onDownvote={onDownvote}
                  onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-canvas-border bg-white p-3 text-gray-500 shadow-sm transition-colors hover:bg-gray-100"
          >
            <Icon svg={chevronIcon} className="h-5 w-5 -rotate-90" />
          </button>
        </div>
      )}
    </section>
  );
}

export default PostCarousel;
