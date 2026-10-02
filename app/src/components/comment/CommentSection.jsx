import { useState } from "react";
import Comment from "./Comment";
import AddCommentButton from "./AddCommentButton";
import AddCommentForm from "./AddCommentForm";
import ArticleSection from "@/components/post/reader/ArticleSection";
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
    <ArticleSection
      title={`Comments (${count})`}
      action={
        !locked && (
          <AddCommentButton open={addingRoot} onClick={() => requireSignIn("comment") && setAddingRoot((a) => !a)} />
        )
      }
    >
      {error && <Message tone="error" className="mt-2">{error}</Message>}

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
    </ArticleSection>
  );
}

export default CommentSection;
