// Shared by post votes (prisma.vote, keyed postId_userId) and comment votes
// (prisma.commentVote, keyed commentId_userId). Same vote again removes it,
// the opposite vote switches it, no vote adds it - the frontend's
// applyVoteToggle() predicts exactly this.
export async function toggleVote(delegate, where, data, value) {
  const existing = await delegate.findUnique({ where });
  try {
    if (existing?.value === value) {
      await delegate.delete({ where });
    } else if (existing) {
      await delegate.update({ where, data: { value } });
    } else {
      await delegate.create({ data: { ...data, value } });
    }
  } catch (err) {
    // Two overlapping toggles (a burst of rapid clicks) can race this
    // read-then-write and collide on the write. Whichever won already left
    // the vote in a valid state and the caller re-fetches for its response,
    // so the loser just no-ops instead of 500ing.
    if (err.code !== "P2002" && err.code !== "P2025") throw err;
  }
}
