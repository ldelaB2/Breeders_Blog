import { useUser } from "@clerk/react";
import { useVoteActions } from "./useVoteActions";
import { applyPinToggle } from "./voting";

// Vote + pin handlers for any component holding a list of posts in local
// state (Topic page, home carousels). Same optimistic pattern as useVoteActions.
export function usePostActions(setPosts, api, setError) {
  const { user } = useUser();
  const { runOptimistic, onUpvote, onDownvote } = useVoteActions(
    setPosts,
    { upvote: api.upvotePost, downvote: api.downvotePost },
    setError
  );

  function onTogglePin(id) {
    if (!user) return;
    runOptimistic(id, (p) => ({ pinnedBy: applyPinToggle(p.pinnedBy, user.id) }), () => api.pinPost(id), setError);
  }

  return { onTogglePin, onUpvote, onDownvote };
}
