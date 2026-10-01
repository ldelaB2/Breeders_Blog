// Splits a post's or comment's vote rows into the two user-id lists the
// frontend works with.
export function serializeVotes(votes) {
  return {
    upvotes: votes.filter((v) => v.value === 1).map((v) => v.userId),
    downvotes: votes.filter((v) => v.value === -1).map((v) => v.userId),
  };
}
