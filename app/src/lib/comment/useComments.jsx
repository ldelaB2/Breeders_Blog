import { useUser } from "@clerk/react";
import { useApi } from "@/lib/api/useApi";
import { useAsync } from "@/lib/hooks/useAsync";
import { useVoteActions } from "@/lib/vote/useVoteActions";
import { buildChildrenMap } from "./commentTree";

// A post's comment thread: loads it once Clerk knows who the viewer is (and
// again when they sign in or out, since each comment carries the viewer's
// own vote), groups it into a reply tree, and returns the actions every
// <Comment> in the tree shares.
export function useComments(postId) {
  const api = useApi();
  const { user, isLoaded } = useUser();
  const { data: comments, setData: setComments, error, setError } = useAsync(
    () => api.fetchComments(postId),
    [api, postId, user?.id],
    { enabled: isLoaded, initialData: [] },
  );
  const { patch, onUpvote, onDownvote } = useVoteActions(
    setComments,
    { upvote: api.upvoteComment, downvote: api.downvoteComment },
    setError,
  );

  // Inserts a temporary comment immediately so the author sees it right
  // away, then swaps it for the server's real one (real id, real
  // timestamp-derived ordering) - or drops it and surfaces the error if the
  // request fails.
  async function add(parentId, text) {
    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimisticComment = {
      id: tempId,
      postId,
      parentId: parentId || null,
      authorId: user?.id,
      authorName: user?.fullName || user?.username || "Anonymous",
      text,
      deleted: false,
      upvoteCount: 0,
      downvoteCount: 0,
      myVote: 0,
    };
    setComments((prev) => [...prev, optimisticComment]);
    try {
      const created = await api.createComment(postId, { text, parentId });
      setComments((prev) => prev.map((c) => (c.id === tempId ? created : c)));
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setError(err.message);
    }
  }

  // Moderator delete/restore: the server returns the updated comment.
  const moderate = (apiCall) => async (commentId) => {
    try {
      const updated = await apiCall(commentId);
      patch(commentId, () => updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const childrenByParent = buildChildrenMap(comments);

  return {
    count: comments.length,
    roots: childrenByParent.get(null) || [],
    childrenByParent,
    error,
    actions: {
      add,
      upvote: onUpvote,
      downvote: onDownvote,
      remove: moderate(api.deleteComment),
      restore: moderate(api.restoreComment),
    },
  };
}
