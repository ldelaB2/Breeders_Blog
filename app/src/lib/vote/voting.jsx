// Derives the shared { score, myVote } shape VoteControls needs from a
// post/comment's vote fields as the API serializes them: upvoteCount,
// downvoteCount and the viewer's own myVote (1, -1 or 0).
export function voteState(item) {
  return { score: item.upvoteCount - item.downvoteCount, myVote: item.myVote };
}

// Predicts { upvoteCount, downvoteCount, myVote } after the viewer toggles
// `value` (1 or -1) - mirrors the backend's toggleVote exactly (same vote
// removes it, opposite vote switches it, no vote adds it), so an optimistic
// UI update never has to guess differently from what the server will do.
export function applyVoteToggle(item, value) {
  const myVote = item.myVote === value ? 0 : value;
  const delta = (side) => (myVote === side) - (item.myVote === side);
  return {
    upvoteCount: item.upvoteCount + delta(1),
    downvoteCount: item.downvoteCount + delta(-1),
    myVote,
  };
}
