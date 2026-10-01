import { useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import IconButton from "@/components/ui/IconButton";
import Message from "@/components/ui/Message";
import PostSearchInput from "@/components/search/PostSearchInput";
import PostSearchResults from "@/components/search/PostSearchResults";
import { useApi } from "@/lib/api/useApi";
import { useAsync } from "@/lib/hooks/useAsync";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { usePostSearch } from "@/lib/post/usePostSearch";

// How long after a link is added or removed before the next change can be made.
const LINK_COOLDOWN_MS = 750;

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

  // One add/remove at a time, plus a short cooldown after each, so a double
  // click can't send the same change twice. The ref blocks synchronously
  // (state wouldn't update between two clicks in the same tick); `busy`
  // drives the disabled look.
  const lockRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const runLocked = async (fn) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setBusy(true);
    await run(fn);
    setTimeout(() => {
      lockRef.current = false;
      setBusy(false);
    }, LINK_COOLDOWN_MS);
  };

  const addLink = (post) =>
    runLocked(async () => {
      await api.linkPost(postId, post.id);
      linked.setData((prev) => (prev.some((p) => p.id === post.id) ? prev : [...prev, post]));
      setQuery("");
    });

  const removeLink = (targetId) =>
    runLocked(async () => {
      await api.unlinkPost(postId, targetId);
      linked.setData((prev) => prev.filter((p) => p.id !== targetId));
    });

  return (
    <Modal onClose={onClose} title="Linked Posts" showClose align="top" className="max-w-xl p-4">
      <PostSearchInput value={query} onChange={setQuery} />

      {error && <Message tone="error" className="mt-2">{error}</Message>}

      {query.trim() && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-100">
          <PostSearchResults
            query={query}
            results={addableResults}
            loading={search.loading}
            onSelect={addLink}
            disabled={busy}
          />
        </div>
      )}

      <div className="mt-4 max-h-[50vh] overflow-y-auto">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Linked posts{!linked.loading && ` (${linkedPosts.length})`}
        </p>
        {/* Until the fetch lands, the list is just the empty initialData -
            say so rather than claiming there are no links. */}
        {linked.loading ? (
          <Message className="text-sm">Loading linked posts…</Message>
        ) : linkedPosts.length === 0 ? (
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
                  className="shrink-0 disabled:cursor-wait disabled:opacity-50"
                  onClick={() => removeLink(post.id)}
                  disabled={busy}
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
