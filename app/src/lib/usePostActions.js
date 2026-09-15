// Shared pin/vote handlers for any component holding a list of posts in
// local state - mutates the post on the server, then replaces it in place
// in that list, so the caller doesn't have to re-fetch the whole feed.
export function usePostActions(setPosts, api, setError) {
  function replace(updated) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  async function run(action, id) {
    try {
      replace(await action(id));
    } catch (err) {
      setError?.(err.message);
    }
  }

  return {
    onTogglePin: (id) => run(api.pinPost, id),
    onUpvote: (id) => run(api.upvotePost, id),
    onDownvote: (id) => run(api.downvotePost, id),
  };
}
