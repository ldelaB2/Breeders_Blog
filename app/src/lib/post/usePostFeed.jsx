import { useUser } from "@clerk/react";
import { useApi } from "@/lib/api/useApi";
import { useAsync } from "@/lib/hooks/useAsync";
import { useVoteActions } from "@/lib/vote/useVoteActions";
import { applyPinToggle } from "@/lib/vote/voting";

// Everything a list of post tiles needs (Topic page, home carousels, linked
// posts): loads the list via `fetcher(api)` (refetching when `deps`
// change), and returns `actions` to hand to each <PostTile>. Votes and pins
// are optimistic (same pattern as useVoteActions); lock swaps in the
// server's copy; archive/delete remove the post and throw on failure so the
// tile's ConfirmModal can show the error.
export function usePostFeed(fetcher, deps = [], { enabled = true } = {}) {
  const api = useApi();
  const { user } = useUser();
  const { data: posts, setData: setPosts, loading, error, setError } = useAsync(
    () => fetcher(api),
    [api, ...deps],
    { enabled, initialData: [] },
  );
  const { runOptimistic, onUpvote, onDownvote } = useVoteActions(
    setPosts,
    { upvote: api.upvotePost, downvote: api.downvotePost },
    setError,
  );

  const remove = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

  const actions = {
    onUpvote,
    onDownvote,
    onTogglePin(id) {
      if (!user) return;
      runOptimistic(id, (p) => ({ pinnedBy: applyPinToggle(p.pinnedBy, user.id) }), () => api.pinPost(id), setError);
    },
    async onToggleLock(id) {
      try {
        const updated = await api.lockPost(id);
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } catch (err) {
        setError(err.message);
      }
    },
    async onArchive(id) {
      await api.archivePost(id);
      remove(id);
    },
    async onDelete(id) {
      await api.deletePost(id);
      remove(id);
    },
  };

  const addPost = (post) => setPosts((prev) => [post, ...prev]);

  return { posts, loading, error, actions, addPost };
}
