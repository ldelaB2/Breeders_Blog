// A post's or comment's vote rows as the frontend sees them: totals plus
// the viewer's own vote (1, -1, or 0 for none/anonymous). Never the voters'
// ids - who voted which way isn't public.
export function serializeVotes(votes, viewer) {
  return {
    upvoteCount: votes.filter((v) => v.value === 1).length,
    downvoteCount: votes.filter((v) => v.value === -1).length,
    myVote: votes.find((v) => v.userId === viewer?.id)?.value ?? 0,
  };
}
