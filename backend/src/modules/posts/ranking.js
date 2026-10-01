import { serializePosts } from "./serializePost.js";

// Post ranking formula, kept in its own module so it can be tuned without
// touching the routes that use it. Mirrors app/src/lib/post/postSort.jsx on
// the frontend - the two run in separate deployables so this is a
// deliberate, small duplication rather than a shared package.
const WEIGHTS = {
  upvote: 1,
  downvote: 1,
  comment: 2, // a comment reflects more engagement than a vote, so it counts for more
};

export function rankScore(post) {
  return (
    post.upvotes.length * WEIGHTS.upvote -
    post.downvotes.length * WEIGHTS.downvote +
    (post.commentCount ?? 0) * WEIGHTS.comment
  );
}

// Serializes post rows for `viewer` and orders them best first.
export const rankPosts = (posts, viewer) => serializePosts(posts, viewer).sort((a, b) => rankScore(b) - rankScore(a));
