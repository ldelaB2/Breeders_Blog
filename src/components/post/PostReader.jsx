import { useState, useEffect } from "react";
import Icon from "../Icon";
import CommentSection from "../comment/CommentSection";
import Footer from "../Footer";
import { fetchPost } from "../../lib/api";
import backArrowIcon from "../../assets/backarrow.svg?raw";

// Full-screen reader for a single post's stitched HTML body. Rendered
// whenever a post is selected from the topic list, replacing that list
// until the user backs out. Fetches its own detail (including the
// moderator-stitched HTML, which the list endpoint omits) by id.
function PostReader({ postId, onBack, onCommentCountChange }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset before the new fetch resolves so a post switch never briefly
    // shows the previous post's content under the new title.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPost(null);
    setError(null);
    fetchPost(postId)
      .then(setPost)
      .catch((err) => setError(err.message));
  }, [postId]);

  // Keeps this reader's own header/count in sync and reports the new count
  // up to the topic feed, so the post tile isn't stale when the user backs out.
  function handleCommentCountChange(commentCount) {
    setPost((prev) => (prev ? { ...prev, commentCount } : prev));
    onCommentCountChange?.(postId, commentCount);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-4 border-b border-gray-200 px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to topic"
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

      <div className="flex-1 overflow-y-auto">
        {error && <p className="px-6 py-4 text-sm text-red-600">{error}</p>}

        {!post && !error ? (
          <p className="px-6 py-4 text-sm text-gray-500">Loading…</p>
        ) : post ? (
          <>
            <p className="border-b border-gray-200 px-6 py-4 text-sm text-gray-600">
              {post.abstract}
            </p>

            {post.html ? (
              // Sandboxed with no flags set: post HTML can't run scripts, submit
              // forms, or access anything as this origin — it's untrusted content.
              <iframe
                title={post.title}
                srcDoc={post.html}
                sandbox=""
                className="h-[75vh] w-full border-0"
              />
            ) : (
              <p className="px-6 py-8 text-center text-sm text-gray-500">
                This post is still pending review, so there's no preview yet.
              </p>
            )}

            <CommentSection
              postId={post.id}
              locked={post.locked}
              onCommentCountChange={handleCommentCountChange}
            />
          </>
        ) : null}

        <Footer />
      </div>
    </div>
  );
}

export default PostReader;
