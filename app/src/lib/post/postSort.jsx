// Post feed ordering, kept in its own module so the ranking formula can be
// tuned independently of the components that display the feed.
//
// Rule: whatever the current viewer has pinned always comes first; everything
// else is ordered by an engagement rank score, highest first.

// Tunable weights for the rank score below - adjust these to change how
// much each signal contributes without touching any component code.
const WEIGHTS = {
  upvote: 1,
  downvote: 1,
  comment: 2, // a comment reflects more engagement than a vote, so it counts for more
};

// A post's rank: net votes plus a bonus for comment activity.
function rankScore(post) {
  return (
    post.upvotes.length * WEIGHTS.upvote -
    post.downvotes.length * WEIGHTS.downvote +
    (post.commentCount ?? 0) * WEIGHTS.comment
  );
}

// Orders a topic's posts for display: posts the viewer has pinned first
// (highest rank among themselves), then the rest by rank score.
export function sortPosts(posts, viewerId) {
  const isPinned = (post) => Boolean(viewerId && post.pinnedBy.includes(viewerId));

  return [...posts].sort((a, b) => {
    const pinnedDiff = Number(isPinned(b)) - Number(isPinned(a));
    if (pinnedDiff !== 0) return pinnedDiff;
    return rankScore(b) - rankScore(a);
  });
}
