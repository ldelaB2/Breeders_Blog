import { useUser } from "@clerk/react";
import { useApi } from "@/lib/api/useApi";
import { useAsync } from "@/lib/hooks/useAsync";
import { useVoteActions } from "@/lib/vote/useVoteActions";

// Everything a list of post tiles needs (Topic page, home carousels, linked
// posts): loads the list via `fetcher(api)` (refetching when `deps` change,
// or the viewer signs in or out - each post carries the viewer's own vote
// and pin, so the first fetch waits for Clerk to know who that is), and
// returns `actions` to hand to each <PostTile>. Votes and pins
// are optimistic (same pattern as useVoteActions); lock swaps in the
// server's copy; archive/delete remove the post and throw on failure so the
// tile's ConfirmModal can show the error.
export function usePostFeed(fetcher, deps = [], { enabled = true } = {}) {
  const api = useApi();
  const { user, isLoaded } = useUser();
  const { data: posts, setData: setPosts, loading, error, setError } = useAsync(
    () => fetcher(api),
    [api, user?.id, ...deps],
    { enabled: enabled && isLoaded, initialData: [] },
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
      runOptimistic(id, (p) => ({ pinned: !p.pinned }), () => api.pinPost(id), setError);
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

  return { posts, loading: loading || (enabled && !isLoaded), error, actions, addPost };
}
