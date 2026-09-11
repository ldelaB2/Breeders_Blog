import { useState } from "react";
import Icon from "../Icon";
import VoteControls from "../VoteControls";
import AddCommentButton from "./AddCommentButton";
import AddCommentForm from "./AddCommentForm";
import chevronIcon from "../../assets/chevron.svg?raw";

// A single comment plus its replies, nested recursively with a connecting
// line per depth (Reddit-style threading).
function Comment({ comment, childrenByParent, onAdd }) {
  const [expanded, setExpanded] = useState(true);
  const [replying, setReplying] = useState(false);
  const replies = childrenByParent.get(comment.comment_id) || [];
  const hasReplies = replies.length > 0;

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
              {comment.author}
            </span>
            <VoteControls score={comment.voteScore} />
            <AddCommentButton
              open={replying}
              onClick={() => setReplying((r) => !r)}
            />
          </div>
          <p className="mt-0.5 text-base text-gray-700">{comment.text}</p>

          {replying && (
            <AddCommentForm
              onSubmit={(text) => {
                onAdd(comment.comment_id, text);
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
              key={reply.comment_id}
              comment={reply}
              childrenByParent={childrenByParent}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Comment;
