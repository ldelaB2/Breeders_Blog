import { useUser } from "@clerk/react";
import Icon from "../Icon";
import VoteControls from "../VoteControls";
import { voteState } from "../../lib/voting";
import { useToast } from "../../lib/useToast";
import { useCurrentUser } from "../../lib/useCurrentUser";
import pinIcon from "../../assets/pin.svg?raw";
import commentIcon from "../../assets/comment.svg?raw";
import lockIcon from "../../assets/lock.svg?raw";
import archiveIcon from "../../assets/archive.svg?raw";

function Post({ post, onSelect, onTogglePin, onUpvote, onDownvote, onToggleLock, onArchive }) {
  const { user } = useUser();
  const { isModerator } = useCurrentUser();
  const showToast = useToast();
  const isPinned = user ? post.pinnedBy.includes(user.id) : false;
  const { score, myVote } = voteState(post.upvotes, post.downvotes, user?.id);
  const isPending = post.status === "PENDING";
  const canModerate = isModerator && post.status === "APPROVED";

  function requireSignIn(action) {
    if (user) return true;
    showToast(`Please sign in to ${action}`);
    return false;
  }

  return (
    <div
      onClick={() => {
        if (!isPending) onSelect?.(post);
      }}
      className={`group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow ${
        isPending ? "cursor-default" : "cursor-pointer hover:shadow-md"
      }`}
    >
      {/* Header row: title, author, pin */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="truncate font-bold text-gray-900">{post.title}</h3>
          <span className="shrink-0 text-sm text-gray-500">{post.authorName}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {post.status === "PENDING" && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
              Pending
            </span>
          )}

          {post.locked && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              Locked
            </span>
          )}

          {canModerate && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock?.(post.id);
                }}
                aria-label={post.locked ? "Unlock post" : "Lock post"}
                aria-pressed={post.locked}
                className={`rounded-md p-1.5 transition-colors hover:bg-gray-100 ${
                  post.locked ? "text-amber-500" : "text-gray-300"
                }`}
              >
                <Icon svg={lockIcon} className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.(post.id);
                }}
                aria-label="Archive post"
                className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <Icon svg={archiveIcon} className="h-5 w-5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (requireSignIn("pin posts")) onTogglePin?.(post.id);
            }}
            aria-label={isPinned ? "Unpin post" : "Pin post"}
            aria-pressed={isPinned}
            className={`rounded-md p-1.5 transition-colors hover:bg-gray-100 ${
              isPinned ? "text-amber-500" : "text-gray-300"
            }`}
          >
            <Icon svg={pinIcon} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Abstract: clamped to a couple lines, expands on hover */}
      <div className="mt-3 max-h-10 overflow-hidden transition-[max-height] duration-400 ease-in-out group-hover:max-h-40 group-hover:overflow-y-auto">
        <p className="line-clamp-2 text-sm text-gray-600 group-hover:line-clamp-none">
          {post.abstract}
        </p>
      </div>

      {/* Footer row: comments bottom left, vote controls bottom right */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-500">
          <Icon svg={commentIcon} className="h-4 w-4" />
          <span>{post.commentCount}</span>
        </div>

        <VoteControls
          score={score}
          myVote={myVote}
          onUpvote={() => requireSignIn("vote") && onUpvote?.(post.id)}
          onDownvote={() => requireSignIn("vote") && onDownvote?.(post.id)}
        />
      </div>
    </div>
  );
}

export default Post;
