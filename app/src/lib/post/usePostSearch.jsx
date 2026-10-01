import { useApi } from "@/lib/api/useApi";
import { useAsync } from "@/lib/hooks/useAsync";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const DEBOUNCE_MS = 300;

// Searches approved posts by title and abstract only (never the stitched
// HTML body) as the user types, one request per pause in typing. Shared by
// the header search and the link-posts modal. `loading` is true from the
// first keystroke, so "Searching…" shows during the debounce too.
export function usePostSearch(query) {
  const api = useApi();
  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, DEBOUNCE_MS);
  const { data, loading, error } = useAsync(() => api.searchPosts(debounced), [api, debounced], {
    enabled: Boolean(debounced),
    initialData: [],
  });

  return {
    results: trimmed ? data : [],
    loading: Boolean(trimmed) && (loading || debounced !== trimmed),
    error,
  };
}
