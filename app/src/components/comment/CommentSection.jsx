import { useState } from "react";
import Comment from "./Comment";
import AddCommentButton from "./AddCommentButton";
import AddCommentForm from "./AddCommentForm";
import Message from "@/components/ui/Message";
import { useRequireSignIn } from "@/lib/auth/useRequireSignIn";
import { useComments } from "@/lib/comment/useComments";

function CommentSection({ postId, locked }) {
  const requireSignIn = useRequireSignIn();
  const { count, roots, childrenByParent, error, actions } = useComments(postId);
  const [addingRoot, setAddingRoot] = useState(false);
  // Everything each <Comment> in the tree needs besides its own data.
  const thread = { childrenByParent, locked, actions };

  return (
    <div className="border-t border-gray-200 px-6 py-6">
      {error && <Message tone="error" className="mb-2">{error}</Message>}

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">Comments ({count})</h2>
        {!locked && (
          <AddCommentButton
            open={addingRoot}
            onClick={() => requireSignIn("comment") && setAddingRoot((a) => !a)}
          />
        )}
      </div>

      {locked && <Message className="mt-1 text-sm">Comments are locked for this post.</Message>}

      {addingRoot && (
        <AddCommentForm
          onSubmit={(text) => {
            actions.add(null, text);
            setAddingRoot(false);
          }}
          onCancel={() => setAddingRoot(false)}
        />
      )}

      <div className="mt-4">
        {roots.length === 0 ? (
          <Message className="text-sm">No comments yet.</Message>
        ) : (
          <div className="flex flex-col gap-4">
            {roots.map((root) => (
              <Comment key={root.id} comment={root} thread={thread} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentSection;
