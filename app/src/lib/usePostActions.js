import { useUser } from "@clerk/react";
import { useOptimisticList } from "./useOptimisticList";
import { applyVoteToggle, applyPinToggle } from "./voting";

// Shared pin/vote handlers for any component holding a list of posts in
// local state. Updates the post in place immediately (optimistic), fires
// the mutation in the background, then reconciles with the server's real
// response - or rolls back to the exact prior state if it fails.
export function usePostActions(setPosts, api, setError) {
  const { user } = useUser();
  const { runOptimistic } = useOptimisticList(setPosts);

  function runVote(apiFn, id, value) {
    if (!user) return;
    runOptimistic(id, (p) => applyVoteToggle(p.upvotes, p.downvotes, user.id, value), () => apiFn(id), setError);
  }

  function runPin(id) {
    if (!user) return;
    runOptimistic(id, (p) => ({ pinnedBy: applyPinToggle(p.pinnedBy, user.id) }), () => api.pinPost(id), setError);
  }

  return {
    onTogglePin: (id) => runPin(id),
    onUpvote: (id) => runVote(api.upvotePost, id, 1),
    onDownvote: (id) => runVote(api.downvotePost, id, -1),
  };
}
