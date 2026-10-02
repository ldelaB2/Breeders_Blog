import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Icon from "@/components/ui/Icon";
import IconButton from "@/components/ui/IconButton";
import VoteControls from "@/components/vote/VoteControls";
import LinkPostModal from "./LinkPostModal";
import { topicLabel } from "@/config/topics";
import { useCurrentUser } from "@/lib/auth/currentUser";
import { useRequireSignIn } from "@/lib/auth/useRequireSignIn";
import { postPath } from "@/lib/seo/seo";
import { cn } from "@/lib/utils/cn";
import { voteState } from "@/lib/vote/voting";

// One post card in a list. All data changes go through `actions` (from
// usePostFeed); the tile only owns which of its popups is open.
//
// `showTopic` is only turned on where posts from different topics mix
// (home carousels, linked posts) - Topic.jsx already makes the topic
// obvious from its own heading, so it leaves this off.
function PostTile({ post, actions, showTopic = false }) {
  const { user } = useUser();
  const { isModerator, isAdmin } = useCurrentUser();
  const requireSignIn = useRequireSignIn();
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(null); // "delete" | "archive" | "link" | null
  const [avatarFailed, setAvatarFailed] = useState(false);

  const isPinned = user ? post.pinnedBy.includes(user.id) : false;
  const { score, myVote } = voteState(post.upvotes, post.downvotes, user?.id);
  const isPending = post.status === "PENDING";
  const canModerate = isModerator && post.status === "APPROVED";
  const canLinkPosts = (user?.id === post.authorId || isModerator) && post.status === "APPROVED";
  const closeModal = () => setOpenModal(null);

  return (
    <>
      <div
        onClick={() => {
          if (!isPending) navigate(postPath(post));
        }}
        className={cn(
          "group rounded-lg border border-canvas-border bg-white p-4 shadow-sm transition-shadow",
          isPending ? "cursor-default" : "cursor-pointer hover:shadow-md",
        )}
      >
        {/* Header row: title, author, actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            {/* A real link (not just the tile's onClick) so crawlers can
                follow it; stopPropagation keeps the tile from navigating twice. */}
            <h3 className="truncate text-lg font-bold text-gray-900">
              {isPending ? (
                post.title
              ) : (
                <Link to={postPath(post)} onClick={(e) => e.stopPropagation()}>
                  {post.title}
                </Link>
              )}
            </h3>

            {post.authorAvatarUrl && !avatarFailed ? (
              <img
                src={post.authorAvatarUrl}
                alt=""
                className="h-5 w-5 shrink-0 self-center rounded-full border border-gray-200 object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span
                aria-hidden="true"
                className="h-5 w-5 shrink-0 self-center rounded-full border border-gray-200 bg-gray-200"
              />
            )}

            <span className="shrink-0 text-sm text-gray-500">{post.authorName}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {isPending && <Badge tone="warning">Pending</Badge>}
            {post.locked && <Badge>Locked</Badge>}

            {canModerate && (
              <>
                <IconButton
                  icon="lock"
                  label={post.locked ? "Unlock post" : "Lock post"}
                  tone="toggle"
                  pressed={post.locked}
                  stopPropagation
                  onClick={() => actions.onToggleLock(post.id)}
                />
                <IconButton
                  icon="archive"
                  label="Archive post"
                  tone="subtle"
                  stopPropagation
                  onClick={() => setOpenModal("archive")}
                />
              </>
            )}

            {canLinkPosts && (
              <IconButton
                icon="link"
                label="Manage linked posts"
                tone="subtle"
                stopPropagation
                onClick={() => setOpenModal("link")}
              />
            )}

            <IconButton
              icon="pin"
              label={isPinned ? "Unpin post" : "Pin post"}
              tone="toggle"
              pressed={isPinned}
              stopPropagation
              onClick={() => requireSignIn("pin posts") && actions.onTogglePin(post.id)}
            />

            {isAdmin && (
              <IconButton
                icon="delete"
                label="Delete post"
                tone="danger"
                stopPropagation
                onClick={() => setOpenModal("delete")}
              />
            )}
          </div>
        </div>

        {/* Abstract: clamped to a couple lines, expands on hover */}
        <div className="mt-3 max-h-10 overflow-hidden transition-[max-height] duration-400 ease-in-out group-hover:max-h-40 group-hover:overflow-y-auto">
          <p className="line-clamp-2 text-sm text-gray-600 group-hover:line-clamp-none">{post.abstract}</p>
        </div>

        {/* Footer row: comments bottom left, vote controls bottom right */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <Icon name="comment" className="h-4 w-4" />
            <span>{post.commentCount}</span>
          </div>

          <VoteControls
            score={score}
            myVote={myVote}
            onUpvote={() => requireSignIn("vote") && actions.onUpvote(post.id)}
            onDownvote={() => requireSignIn("vote") && actions.onDownvote(post.id)}
          />
        </div>

        {showTopic && (
          <div className="mt-3 border-t border-gray-100 pt-2">
            <Badge>{topicLabel(post.topicSlug)}</Badge>
          </div>
        )}
      </div>

      {/* Delete deliberately requires this explicit click-through - it's
          irreversible (unlike archive) and removes the post's comments,
          votes, and pins along with it. */}
      {openModal === "delete" && (
        <ConfirmModal
          title="Delete post"
          subtitle={post.title}
          confirmLabel="Delete post"
          pendingLabel="Deleting…"
          onConfirm={() => actions.onDelete(post.id)}
          onClose={closeModal}
        >
          This permanently deletes the post along with all of its comments, votes, and pins. This can't be undone.
        </ConfirmModal>
      )}
      {openModal === "archive" && (
        <ConfirmModal
          title="Archive post"
          subtitle={post.title}
          confirmLabel="Archive post"
          pendingLabel="Archiving…"
          variant="primary"
          onConfirm={() => actions.onArchive(post.id)}
          onClose={closeModal}
        >
          This moves the post to the Archive topic and locks it.
        </ConfirmModal>
      )}
      {openModal === "link" && <LinkPostModal postId={post.id} onClose={closeModal} />}
    </>
  );
}

export default PostTile;
