import { useState, useEffect } from "react";
import Icon from "../Icon";
import CommentSection from "../comment/CommentSection";
import { fetchPost } from "../../lib/api";
import backArrowIcon from "../../assets/backarrow.svg?raw";

const DEFAULT_TITLE = "Breeders Blog";
const DEFAULT_DESCRIPTION =
  "Breeders Blog — research and notes on genomic selection, quantitative genetics, and modern breeding methods.";

// A single post's page, reached at /posts/:id. Fetches its own detail
// (including the moderator-stitched HTML, which list endpoints omit) by id.
function PostReader({ postId, onBack }) {
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
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
          <p className="border-b border-gray-200 pb-4 text-sm text-gray-600">
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

          <CommentSection postId={post.id} locked={post.locked} />
        </>
      ) : null}
    </div>
  );
}

export default PostReader;
