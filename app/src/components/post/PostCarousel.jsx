import { useRef } from "react";
import PostTile from "./PostTile";
import Icon from "@/components/ui/Icon";
import Message from "@/components/ui/Message";
import { usePostFeed } from "@/lib/post/usePostFeed";
import { cn } from "@/lib/utils/cn";

const SCROLL_AMOUNT = 400; // tile width (w-96 = 384px) + gap-4 (16px)

// A titled row of post tiles that scrolls horizontally. Used for the home
// page's Top Posts, Your Pinned Posts and Recommended for You, and for a
// post's Linked Posts - each just passes a different `fetchPosts(api)`, so
// the row itself doesn't know or care which one it's showing.
function PostCarousel({ title, fetchPosts, emptyMessage }) {
  const scrollRef = useRef(null);
  const { posts, loading, error, actions } = usePostFeed(fetchPosts);

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
      {title && <h2 className="mb-3 text-xl font-bold text-gray-900">{title}</h2>}

      {error && <Message tone="error" className="mb-3">{error}</Message>}

      {posts.length === 0 ? (
        <Message>{emptyMessage}</Message>
      ) : (
        <div className="relative px-12">
          <ScrollArrow direction={-1} onClick={() => scroll(-1)} />

          <div
            ref={scrollRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 py-2"
          >
            {posts.map((post) => (
              <div key={post.id} className="w-96 shrink-0 snap-start">
                <PostTile post={post} actions={actions} showTopic />
              </div>
            ))}
          </div>

          <ScrollArrow direction={1} onClick={() => scroll(1)} />
        </div>
      )}
    </section>
  );
}

// Round chevron button overlaid on either end of the row.
function ScrollArrow({ direction, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction < 0 ? "Scroll left" : "Scroll right"}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-full border border-canvas-border bg-white p-3 text-gray-500 shadow-sm transition-colors hover:bg-gray-100",
        direction < 0 ? "left-0" : "right-0",
      )}
    >
      <Icon name="chevron" className={cn("h-5 w-5", direction < 0 ? "rotate-90" : "-rotate-90")} />
    </button>
  );
}

export default PostCarousel;
