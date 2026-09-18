import { useUser } from "@clerk/react";
import { useOptimisticList } from "./useOptimisticList";
import { applyVoteToggle } from "./voting";

// Optimistic up/downvote handlers for any list of votable items (posts or
// comments) held in local state: toggles the vote in place immediately,
// syncs with the server in the background, and rolls back on failure.
// `upvote`/`downvote` are the api calls taking an item id.
export function useVoteActions(setItems, { upvote, downvote }, setError) {
  const { user } = useUser();
  const { patch, runOptimistic } = useOptimisticList(setItems);

  function vote(apiFn, id, value) {
    if (!user) return;
    runOptimistic(id, (item) => applyVoteToggle(item.upvotes, item.downvotes, user.id, value), () => apiFn(id), setError);
  }

  return {
    patch,
    runOptimistic,
    onUpvote: (id) => vote(upvote, id, 1),
    onDownvote: (id) => vote(downvote, id, -1),
  };
}
