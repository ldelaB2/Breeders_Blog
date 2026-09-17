import Icon from "./Icon";
import upvoteIcon from "../assets/upvote.svg?raw";
import downvoteIcon from "../assets/downvote.svg?raw";

// Shared upvote/downvote widget used by both posts and comments. Controlled:
// the caller owns the real score/myVote (from the API response) and supplies
// the toggle handlers, so this component has no vote state of its own.
function VoteControls({ score, myVote = 0, onUpvote, onDownvote }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpvote?.();
        }}
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        className={`rounded-md p-1 text-accent transition-colors hover:bg-accent-soft ${
          myVote === 1 ? "bg-accent-soft-active" : ""
        }`}
      >
        <Icon svg={upvoteIcon} className="h-4 w-4" />
      </button>

      <span className="min-w-[2ch] text-center font-medium text-gray-700">
        {score}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDownvote?.();
        }}
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        className={`rounded-md p-1 text-red-600 transition-colors hover:bg-red-50 ${
          myVote === -1 ? "bg-red-100" : ""
        }`}
      >
        <Icon svg={downvoteIcon} className="h-4 w-4" />
      </button>
    </div>
  );
}

export default VoteControls;
