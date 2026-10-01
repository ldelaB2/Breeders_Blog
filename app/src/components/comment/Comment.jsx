import { useState } from "react";
import { useUser } from "@clerk/react";
import Icon from "@/components/ui/Icon";
import VoteControls from "@/components/vote/VoteControls";
import AddCommentButton from "./AddCommentButton";
import AddCommentForm from "./AddCommentForm";
import { useCurrentUser } from "@/lib/auth/currentUser";
import { useRequireSignIn } from "@/lib/auth/useRequireSignIn";
import { voteState } from "@/lib/vote/voting";
import { cn } from "@/lib/utils/cn";

// A single comment plus its replies, nested recursively with a connecting
// line per depth (Reddit-style threading). `thread` is shared by the whole
// tree: { childrenByParent, locked, actions } from CommentSection.
function Comment({ comment, thread }) {
  const { childrenByParent, locked, actions } = thread;
  const { user } = useUser();
  const { isModerator } = useCurrentUser();
  const requireSignIn = useRequireSignIn();
  const [expanded, setExpanded] = useState(true);
  const [replying, setReplying] = useState(false);
  const replies = childrenByParent.get(comment.id) || [];
  const hasReplies = replies.length > 0;
  const { score, myVote } = voteState(comment.upvotes, comment.downvotes, user?.id);

  return (
    <div>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          disabled={!hasReplies}
          aria-label={expanded ? "Hide replies" : "Show replies"}
          aria-expanded={expanded}
          className={cn(
            "mt-1 shrink-0 rounded-md p-0.5 text-gray-400 transition-colors",
            hasReplies ? "hover:bg-gray-100 hover:text-gray-600" : "invisible",
          )}
        >
          <Icon name="chevron" className={cn("h-3.5 w-3.5 transition-transform", !expanded && "-rotate-90")} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-gray-900">{comment.authorName}</span>
            <VoteControls
              score={score}
              myVote={myVote}
              onUpvote={() => requireSignIn("vote") && actions.upvote(comment.id)}
              onDownvote={() => requireSignIn("vote") && actions.downvote(comment.id)}
            />
            {!locked && (
              <AddCommentButton open={replying} onClick={() => requireSignIn("comment") && setReplying((r) => !r)} />
            )}
            {isModerator && (
              <button
                type="button"
                onClick={() => (comment.deleted ? actions.restore : actions.remove)(comment.id)}
                className="text-sm text-red-500 transition-colors hover:text-red-700"
              >
                {comment.deleted ? "Restore" : "Delete"}
              </button>
            )}
          </div>
          <p className="mt-0.5 text-base text-gray-700">
            {comment.deleted ? <em className="text-gray-400">[deleted]</em> : comment.text}
          </p>

          {replying && (
            <AddCommentForm
              onSubmit={(text) => {
                actions.add(comment.id, text);
                setReplying(false);
              }}
              onCancel={() => setReplying(false)}
            />
          )}
        </div>
      </div>

      {expanded && hasReplies && (
        <div className="mt-3 ml-3 flex flex-col gap-3 border-l-2 border-gray-200 pl-4">
          {replies.map((reply) => (
            <Comment key={reply.id} comment={reply} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Comment;
