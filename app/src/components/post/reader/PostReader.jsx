import { useEffect } from "react";
import IconButton from "@/components/ui/IconButton";
import Message from "@/components/ui/Message";
import Page from "@/components/ui/Page";
import SharePostButton from "@/components/share/SharePostButton";
import PostArticle from "./PostArticle";
import { fetchPost, recordPostView } from "@/lib/api/client";
import { useAsync } from "@/lib/hooks/useAsync";
import { setCitation } from "@/lib/post/citation";
import { postSeo } from "@/lib/seo/seo";
import { useSeo } from "@/lib/seo/useSeo";

// A single post's page, reached at /posts/:id. Fetches its own detail
// (including the moderator-stitched HTML, which list endpoints omit) by id.
function PostReader({ postId, onBack }) {
  const { data: post, error } = useAsync(() => fetchPost(postId), [postId]);

  // Page metadata and the footer's citation follow the open post (the
  // citation reverts on the way out; the next page sets its own metadata).
  useSeo(post ? postSeo(post, window.location.origin) : error ? { title: "Post not found", noindex: true } : null);
  useEffect(() => {
    if (!post) return;
    setCitation({ title: post.title, author: post.authorName, date: post.createdAt });
    return () => setCitation(null);
  }, [post]);

  // Counts a view toward the post's rank, once per post per browser session
  // (the flag is set before sending, so StrictMode's double effect and
  // reloads don't recount). Best-effort: storage or network failures are ignored.
  const viewableId = post?.status === "APPROVED" ? post.id : null;
  useEffect(() => {
    if (!viewableId) return;
    const key = `viewed:${viewableId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: count it anyway.
    }
    recordPostView(viewableId).catch(() => {});
  }, [viewableId]);

  return (
    <Page>
      <div className="mb-6 flex items-center gap-4 border-b border-canvas-border pb-4">
        <IconButton icon="back-arrow" label="Back" size="lg" tone="strong" className="shrink-0" onClick={onBack} />

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl">{post?.title}</h1>
          <p className="text-sm text-gray-500">{post?.authorName}</p>
        </div>

        {post?.status === "APPROVED" && <SharePostButton post={post} />}
      </div>

      {error && <Message tone="error" className="py-4">{error}</Message>}
      {!post && !error && <Message className="py-4 text-sm">Loading…</Message>}
      {/* Keyed so every per-post bit of state (iframe height, TOC) starts
          fresh when navigating from one post to another. */}
      {post && <PostArticle key={post.id} post={post} />}
    </Page>
  );
}

export default PostReader;
