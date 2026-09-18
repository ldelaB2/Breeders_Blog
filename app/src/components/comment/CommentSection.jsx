import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import Comment from "./Comment";
import AddCommentButton from "./AddCommentButton";
import AddCommentForm from "./AddCommentForm";
import { fetchComments, useApi } from "../../lib/api";
import { useRequireSignIn } from "../../lib/useRequireSignIn";
import { useVoteActions } from "../../lib/useVoteActions";

// Groups a post's comments by parentId so each node can look up its replies
// in O(1); root-level comments live under key null.
function buildChildrenMap(comments) {
  const map = new Map();
  comments.forEach((c) => {
    const siblings = map.get(c.parentId) || [];
    siblings.push(c);
    map.set(c.parentId, siblings);
  });
  return map;
}

function CommentSection({ postId, locked }) {
  const { user } = useUser();
  const requireSignIn = useRequireSignIn();
  const api = useApi();
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [addingRoot, setAddingRoot] = useState(false);
  const { patch, onUpvote, onDownvote } = useVoteActions(
    setComments,
    { upvote: api.upvoteComment, downvote: api.downvoteComment },
    setError
  );

  const load = useCallback(() => {
    fetchComments(postId)
      .then(setComments)
      .catch((err) => setError(err.message));
  }, [postId]);

  useEffect(load, [load]);

  // Inserts a temporary comment immediately so the author sees it right
  // away, then swaps it for the server's real one (real id, real
  // timestamp-derived ordering) - or drops it and surfaces the error if the
  // request fails.
  async function addComment(parentId, text) {
    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimisticComment = {
      id: tempId,
      postId,
      parentId: parentId || null,
      authorId: user?.id,
      authorName: user?.fullName || user?.username || "Anonymous",
      text,
      deleted: false,
      upvotes: [],
      downvotes: [],
    };
    setComments((prev) => [...prev, optimisticComment]);
    try {
      const created = await api.createComment(postId, { text, parentId });
      setComments((prev) => prev.map((c) => (c.id === tempId ? created : c)));
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setError(err.message);
    }
  }

  async function deleteComment(commentId) {
    try {
      const updated = await api.deleteComment(commentId);
      patch(commentId, () => updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function restoreComment(commentId) {
    try {
      const updated = await api.restoreComment(commentId);
      patch(commentId, () => updated);
    } catch (err) {
      setError(err.message);
    }
  }

  const childrenByParent = buildChildrenMap(comments);
  const roots = childrenByParent.get(null) || [];

  return (
    <div className="border-t border-gray-200 px-6 py-6">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">
          Comments ({comments.length})
        </h2>
        {!locked && (
          <AddCommentButton
            open={addingRoot}
            onClick={() => requireSignIn("comment") && setAddingRoot((a) => !a)}
          />
        )}
      </div>

      {locked && <p className="mt-1 text-sm text-gray-500">Comments are locked for this post.</p>}

      {addingRoot && (
        <AddCommentForm
          onSubmit={(text) => {
            addComment(null, text);
            setAddingRoot(false);
          }}
          onCancel={() => setAddingRoot(false)}
        />
      )}

      <div className="mt-4">
        {roots.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {roots.map((root) => (
              <Comment
                key={root.id}
                comment={root}
                childrenByParent={childrenByParent}
                locked={locked}
                onAdd={addComment}
                onUpvote={onUpvote}
                onDownvote={onDownvote}
                onDelete={deleteComment}
                onRestore={restoreComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentSection;
