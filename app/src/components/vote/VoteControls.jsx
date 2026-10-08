import IconButton from "@/components/ui/IconButton";
import { cn } from "@/lib/utils/cn";

// Shared upvote/downvote widget used by both posts and comments. Controlled:
// the caller owns the real score/myVote (from the API response) and supplies
// the toggle handlers, so this component has no vote state of its own.
// `disabled` is for items that can't be voted on yet (a comment still
// being posted).
function VoteControls({ score, myVote = 0, onUpvote, onDownvote, disabled }) {
  return (
    <div className="flex items-center gap-1">
      <IconButton
        icon="upvote"
        label="Upvote"
        size="sm"
        tone={null}
        pressed={myVote === 1}
        disabled={disabled}
        stopPropagation
        onClick={() => onUpvote?.()}
        className={cn("text-accent hover:bg-accent-soft", myVote === 1 && "bg-accent-soft-active")}
      />

      <span className="min-w-[2ch] text-center font-medium text-gray-700">{score}</span>

      <IconButton
        icon="downvote"
        label="Downvote"
        size="sm"
        tone={null}
        pressed={myVote === -1}
        disabled={disabled}
        stopPropagation
        onClick={() => onDownvote?.()}
        className={cn("text-red-600 hover:bg-red-50", myVote === -1 && "bg-red-100")}
      />
    </div>
  );
}

export default VoteControls;
