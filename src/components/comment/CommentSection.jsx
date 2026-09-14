import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import Comment from "./Comment";
import AddCommentButton from "./AddCommentButton";
import AddCommentForm from "./AddCommentForm";
import { fetchComments, useApi } from "../../lib/api";
import { useToast } from "../../lib/useToast";

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

function CommentSection({ postId, onCommentCountChange }) {
  const { user } = useUser();
  const showToast = useToast();
  const api = useApi();
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [addingRoot, setAddingRoot] = useState(false);

  const load = useCallback(() => {
    fetchComments(postId)
      .then(setComments)
      .catch((err) => setError(err.message));
  }, [postId]);

  useEffect(load, [load]);

  function replaceComment(updated) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function addComment(parentId, text) {
    try {
      const created = await api.createComment(postId, { text, parentId });
      setComments((prev) => [...prev, created]);
      // Only live (non-deleted) comments count, matching how the backend
      // computes PostMetadata.commentCount.
      const liveCount = comments.filter((c) => !c.deleted).length + 1;
      onCommentCountChange?.(liveCount);
    } catch (err) {
      setError(err.message);
    }
  }

  async function upvoteComment(commentId) {
    try {
      replaceComment(await api.upvoteComment(commentId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function downvoteComment(commentId) {
    try {
      replaceComment(await api.downvoteComment(commentId));
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
        <AddCommentButton
          open={addingRoot}
          onClick={() => {
            if (!user) return showToast("Please sign in to comment");
            setAddingRoot((a) => !a);
          }}
        />
      </div>

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
                onAdd={addComment}
                onUpvote={upvoteComment}
                onDownvote={downvoteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentSection;
