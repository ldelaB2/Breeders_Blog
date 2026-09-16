import { useUser } from "@clerk/react";
import { useOptimisticList } from "./useOptimisticList";
import { applyVoteToggle, applyPinToggle } from "./voting";

// Shared pin/vote handlers for any component holding a list of posts in
// local state. Updates the post in place immediately (optimistic), fires
// the mutation in the background, then reconciles with the server's real
// response - or rolls back to the exact prior state if it fails.
export function usePostActions(setPosts, api, setError) {
  const { user } = useUser();
  const { patch, optimisticUpdate } = useOptimisticList(setPosts);

  async function runVote(apiFn, id, value) {
    if (!user) return;
    const rollback = optimisticUpdate(id, (p) => applyVoteToggle(p.upvotes, p.downvotes, user.id, value));
    try {
      const updated = await apiFn(id);
      patch(id, () => updated);
    } catch (err) {
      rollback();
      setError?.(err.message);
    }
  }

  async function runPin(id) {
    if (!user) return;
    const rollback = optimisticUpdate(id, (p) => ({ pinnedBy: applyPinToggle(p.pinnedBy, user.id) }));
    try {
      const updated = await api.pinPost(id);
      patch(id, () => updated);
    } catch (err) {
      rollback();
      setError?.(err.message);
    }
  }

  return {
    onTogglePin: (id) => runPin(id),
    onUpvote: (id) => runVote(api.upvotePost, id, 1),
    onDownvote: (id) => runVote(api.downvotePost, id, -1),
  };
}
