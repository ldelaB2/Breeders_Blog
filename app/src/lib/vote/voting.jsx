// Derives the shared { score, myVote } shape VoteControls needs from a
// post/comment's upvotes/downvotes user-id arrays plus the viewer's id.
export function voteState(upvotes, downvotes, userId) {
  const score = upvotes.length - downvotes.length;
  const myVote = userId && upvotes.includes(userId) ? 1 : userId && downvotes.includes(userId) ? -1 : 0;
  return { score, myVote };
}

// Predicts {upvotes, downvotes} after toggling `value` (1 or -1) for
// `userId` - mirrors the backend's toggleVote exactly (same vote removes
// it, opposite vote switches it, no vote adds it), so an optimistic UI
// update never has to guess differently from what the server will do.
export function applyVoteToggle(upvotes, downvotes, userId, value) {
  const without = (arr) => arr.filter((id) => id !== userId);
  if (value === 1) {
    return upvotes.includes(userId)
      ? { upvotes: without(upvotes), downvotes }
      : { upvotes: [...without(upvotes), userId], downvotes: without(downvotes) };
  }
  return downvotes.includes(userId)
    ? { upvotes, downvotes: without(downvotes) }
    : { upvotes: without(upvotes), downvotes: [...without(downvotes), userId] };
}

// Same toggle idea for a single boolean-ish membership array (pins).
export function applyPinToggle(pinnedBy, userId) {
  return pinnedBy.includes(userId) ? pinnedBy.filter((id) => id !== userId) : [...pinnedBy, userId];
}
