import { useState } from "react";
import Modal from "@/components/ui/Modal";
import IconButton from "@/components/ui/IconButton";
import Message from "@/components/ui/Message";
import PostSearchInput from "@/components/search/PostSearchInput";
import PostSearchResults from "@/components/search/PostSearchResults";
import { useApi } from "@/lib/api/useApi";
import { useAsync } from "@/lib/hooks/useAsync";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { usePostSearch } from "@/lib/post/usePostSearch";

// Opened from a post tile's chain-link icon (author/moderator/admin only,
// see PostTile.jsx). Reuses the header search to find posts to add; each
// addition/removal hits the server immediately so the list here always
// reflects what's actually linked.
function LinkPostModal({ postId, onClose }) {
  const api = useApi();
  const [query, setQuery] = useState("");
  const search = usePostSearch(query);
  const linked = useAsync(() => api.fetchLinkedPosts(postId), [api, postId], { initialData: [] });
  const { run, error: actionError } = useAsyncAction();
  const linkedPosts = linked.data;

  const linkedIds = new Set(linkedPosts.map((p) => p.id));
  const addableResults = search.results.filter((p) => p.id !== postId && !linkedIds.has(p.id));
  const error = actionError || linked.error || search.error;

  const addLink = (post) =>
    run(async () => {
      await api.linkPost(postId, post.id);
      linked.setData((prev) => [...prev, post]);
      setQuery("");
    });

  const removeLink = (targetId) =>
    run(async () => {
      await api.unlinkPost(postId, targetId);
      linked.setData((prev) => prev.filter((p) => p.id !== targetId));
    });

  return (
    <Modal onClose={onClose} title="Linked Posts" showClose align="top" className="max-w-xl p-4">
      <PostSearchInput value={query} onChange={setQuery} />

      {error && <Message tone="error" className="mt-2">{error}</Message>}

      {query.trim() && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-100">
          <PostSearchResults query={query} results={addableResults} loading={search.loading} onSelect={addLink} />
        </div>
      )}

      <div className="mt-4 max-h-[50vh] overflow-y-auto">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Linked posts ({linkedPosts.length})
        </p>
        {linkedPosts.length === 0 ? (
          <Message className="text-sm">No posts linked yet.</Message>
        ) : (
          <ul className="flex flex-col gap-2">
            {linkedPosts.map((post) => (
              <li
                key={post.id}
                className="flex items-start justify-between gap-2 rounded-md border border-canvas-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{post.title}</p>
                  <p className="line-clamp-2 text-sm text-gray-600">{post.abstract}</p>
                </div>
                <IconButton
                  icon="delete"
                  label="Remove linked post"
                  tone="danger"
                  className="shrink-0"
                  onClick={() => removeLink(post.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export default LinkPostModal;
