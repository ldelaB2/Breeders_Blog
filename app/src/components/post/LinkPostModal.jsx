import { useState, useEffect, useRef } from "react";
import Modal from "../Modal";
import Icon from "../Icon";
import { useApi } from "../../lib/api";
import { topicLabel } from "../../routes";
import deleteIcon from "../../assets/delete_icon.svg?raw";

const DEBOUNCE_MS = 300;

// Opened from a post tile's chain-link icon (author/moderator/admin only,
// see Post.jsx). Reuses the header search bar's title/abstract search to
// find posts to add; each addition/removal hits the server immediately so
// the list here always reflects what's actually linked.
function LinkPostModal({ postId, onClose }) {
  const api = useApi();
  const inputRef = useRef(null);
  const [linkedPosts, setLinkedPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    inputRef.current?.focus();
    api
      .fetchLinkedPosts(postId)
      .then(setLinkedPosts)
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setLoadingResults(false);
      return;
    }
    setLoadingResults(true);
    const timer = setTimeout(() => {
      api
        .searchPosts(trimmed)
        .then(setResults)
        .catch((err) => setError(err.message))
        .finally(() => setLoadingResults(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const linkedIds = new Set(linkedPosts.map((p) => p.id));
  const addableResults = results.filter((p) => p.id !== postId && !linkedIds.has(p.id));

  async function addLink(post) {
    try {
      await api.linkPost(postId, post.id);
      setLinkedPosts((prev) => [...prev, post]);
      setQuery("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeLink(targetId) {
    try {
      await api.unlinkPost(postId, targetId);
      setLinkedPosts((prev) => prev.filter((p) => p.id !== targetId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal onClose={onClose} align="top" className="max-w-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-900">Linked Posts</h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts by title or abstract…"
        className="mt-3 w-full rounded-md border border-gray-200 p-2.5 text-base text-gray-900 focus:border-transparent focus:outline-none"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {query.trim() && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-100">
          {loadingResults ? (
            <p className="px-3 py-2 text-sm text-gray-500">Searching…</p>
          ) : addableResults.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">No posts found.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {addableResults.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => addLink(post)}
                    className="flex w-full flex-col gap-1 px-3 py-2 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-gray-900">{post.title}</span>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {topicLabel(post.topicSlug)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-gray-600">{post.abstract}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 max-h-[50vh] overflow-y-auto">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Linked posts ({linkedPosts.length})
        </p>
        {linkedPosts.length === 0 ? (
          <p className="text-sm text-gray-500">No posts linked yet.</p>
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
                <button
                  type="button"
                  onClick={() => removeLink(post.id)}
                  aria-label="Remove linked post"
                  className="shrink-0 rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Icon svg={deleteIcon} className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export default LinkPostModal;
