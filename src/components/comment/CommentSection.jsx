import { useState } from "react";
import Comment from "./Comment";
import AddCommentButton from "./AddCommentButton";
import AddCommentForm from "./AddCommentForm";
import initialComments from "../../../sample_post/comments.json";

// Groups a post's comments by parent_comment_id so each node can look up its
// replies in O(1); root-level comments live under key -1.
function buildChildrenMap(postComments) {
  const map = new Map();
  postComments.forEach((c) => {
    const siblings = map.get(c.parent_comment_id) || [];
    siblings.push(c);
    map.set(c.parent_comment_id, siblings);
  });
  return map;
}

function CommentSection({ postId }) {
  const [comments, setComments] = useState(initialComments);
  const [addingRoot, setAddingRoot] = useState(false);

  function addComment(parentId, text) {
    const nextId = Math.max(0, ...comments.map((c) => c.comment_id)) + 1;
    setComments((prev) => [
      ...prev,
      {
        comment_id: nextId,
        post_id: postId,
        parent_comment_id: parentId,
        author: "You",
        text,
        voteScore: 0,
      },
    ]);
  }

  const postComments = comments.filter((c) => c.post_id === postId);
  const childrenByParent = buildChildrenMap(postComments);
  const roots = childrenByParent.get(-1) || [];

  return (
    <div className="border-t border-gray-200 px-6 py-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">
          Comments ({postComments.length})
        </h2>
        <AddCommentButton
          open={addingRoot}
          onClick={() => setAddingRoot((a) => !a)}
        />
      </div>

      {addingRoot && (
        <AddCommentForm
          onSubmit={(text) => {
            addComment(-1, text);
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
                key={root.comment_id}
                comment={root}
                childrenByParent={childrenByParent}
                onAdd={addComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentSection;
