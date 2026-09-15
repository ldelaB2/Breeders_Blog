import { useState, useEffect, useRef } from "react";
import { useApi } from "../lib/api";
import { topicLabel } from "../routes";

const DEBOUNCE_MS = 300;

// Opened from the header's search icon. Searches approved posts by title
// and abstract only (never the stitched HTML body) as the user types;
// clicking a result hands its id up to the caller, which is expected to
// close this modal and open that post.
function SearchModal({ onClose, onSelectPost }) {
  const api = useApi();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .searchPosts(trimmed)
        .then(setResults)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 px-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts by title or abstract…"
          className="w-full rounded-md border border-gray-200 p-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
        />

        <div className="mt-3 max-h-96 overflow-y-auto">
          {error && <p className="px-1 py-2 text-sm text-red-600">{error}</p>}

          {!error && loading && <p className="px-1 py-2 text-sm text-gray-500">Searching…</p>}

          {!error && !loading && query.trim() && results.length === 0 && (
            <p className="px-1 py-2 text-sm text-gray-500">No posts found.</p>
          )}

          <ul className="flex flex-col divide-y divide-gray-100">
            {results.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => onSelectPost(post.id)}
                  className="flex w-full flex-col gap-1 px-1 py-3 text-left transition-colors hover:bg-gray-50"
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
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
