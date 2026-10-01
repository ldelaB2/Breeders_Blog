import { serializeVotes } from "../engagement/serializeVotes.js";

// Shapes a Comment row (with votes loaded) into the flat object the
// frontend threads client-side via parentId. Soft-deleted comments keep
// their place in the thread (children still reference them) but hide text.
export function serializeComment(comment) {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    authorId: comment.authorId,
    authorName: comment.authorName,
    text: comment.deletedAt ? null : comment.text,
    deleted: Boolean(comment.deletedAt),
    createdAt: comment.createdAt,
    ...serializeVotes(comment.votes),
  };
}
