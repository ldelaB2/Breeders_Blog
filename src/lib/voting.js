// Derives the shared { score, myVote } shape VoteControls needs from a
// post/comment's upvotes/downvotes user-id arrays plus the viewer's id.
export function voteState(upvotes, downvotes, userId) {
  const score = upvotes.length - downvotes.length;
  const myVote = userId && upvotes.includes(userId) ? 1 : userId && downvotes.includes(userId) ? -1 : 0;
  return { score, myVote };
}
