import { useCallback, useEffect, useRef, useState } from "react";

const resolve = (next, prev) => (typeof next === "function" ? next(prev) : next);

// Loads data for a component: runs `fetcher` on mount and again whenever
// `deps` change. Each run first resets to `initialData`, so switching to a
// different topic/post never briefly shows the previous result, and a
// response that arrives after a newer run started is dropped. With
// `enabled: false` nothing is fetched and loading is false.
//
// setData/setError accept a value or an updater, so callers can patch the
// loaded data in place (optimistic votes, removals) like ordinary state.
export function useAsync(fetcher, deps, { enabled = true, initialData = null } = {}) {
  const initialRef = useRef(initialData);
  const [state, setState] = useState({ data: initialData, loading: enabled, error: null });

  useEffect(() => {
    if (!enabled) {
      setState({ data: initialRef.current, loading: false, error: null });
      return;
    }
    let stale = false;
    setState({ data: initialRef.current, loading: true, error: null });
    fetcher().then(
      (data) => !stale && setState({ data, loading: false, error: null }),
      (err) => !stale && setState((s) => ({ ...s, loading: false, error: err.message })),
    );
    return () => {
      stale = true;
    };
    // `deps` stands in for whatever `fetcher` closes over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const setData = useCallback((next) => setState((s) => ({ ...s, data: resolve(next, s.data) })), []);
  const setError = useCallback((next) => setState((s) => ({ ...s, error: resolve(next, s.error) })), []);

  return { ...state, setData, setError };
}
