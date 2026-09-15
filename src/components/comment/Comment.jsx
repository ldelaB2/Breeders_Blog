import { useState } from "react";
import { useUser } from "@clerk/react";
import Icon from "../Icon";
import VoteControls from "../VoteControls";
import AddCommentButton from "./AddCommentButton";
import AddCommentForm from "./AddCommentForm";
import { voteState } from "../../lib/voting";
import { useToast } from "../../lib/useToast";
import { useCurrentUser } from "../../lib/useCurrentUser";
import chevronIcon from "../../assets/chevron.svg?raw";

// A single comment plus its replies, nested recursively with a connecting
// line per depth (Reddit-style threading).
function Comment({ comment, childrenByParent, locked, onAdd, onUpvote, onDownvote, onDelete }) {
  const { user } = useUser();
  const { isModerator } = useCurrentUser();
  const showToast = useToast();
  const [expanded, setExpanded] = useState(true);
  const [replying, setReplying] = useState(false);
  const replies = childrenByParent.get(comment.id) || [];
  const hasReplies = replies.length > 0;
  const { score, myVote } = voteState(comment.upvotes, comment.downvotes, user?.id);

  function requireSignIn(action) {
    if (user) return true;
    showToast(`Please sign in to ${action}`);
    return false;
  }

  return (
    <div>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          disabled={!hasReplies}
          aria-label={expanded ? "Hide replies" : "Show replies"}
          aria-expanded={expanded}
          className={`mt-1 shrink-0 rounded-md p-0.5 text-gray-400 transition-colors ${
            hasReplies ? "hover:bg-gray-100 hover:text-gray-600" : "invisible"
          }`}
        >
          <Icon
            svg={chevronIcon}
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-gray-900">
              {comment.authorName}
            </span>
            <VoteControls
              score={score}
              myVote={myVote}
              onUpvote={() => requireSignIn("vote") && onUpvote?.(comment.id)}
              onDownvote={() => requireSignIn("vote") && onDownvote?.(comment.id)}
            />
            {!locked && (
              <AddCommentButton
                open={replying}
                onClick={() => requireSignIn("comment") && setReplying((r) => !r)}
              />
            )}
            {isModerator && !comment.deleted && (
              <button
                type="button"
                onClick={() => onDelete?.(comment.id)}
                className="text-sm text-red-500 transition-colors hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>
          <p className="mt-0.5 text-base text-gray-700">
            {comment.deleted ? (
              <em className="text-gray-400">[deleted]</em>
            ) : (
              comment.text
            )}
          </p>

          {replying && (
            <AddCommentForm
              onSubmit={(text) => {
                onAdd(comment.id, text);
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
            <Comment
              key={reply.id}
              comment={reply}
              childrenByParent={childrenByParent}
              locked={locked}
              onAdd={onAdd}
              onUpvote={onUpvote}
              onDownvote={onDownvote}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Comment;
