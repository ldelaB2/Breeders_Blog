import { useCallback, useState } from "react";

// The submit/delete/approve pattern: run(fn) flips `pending` on, clears the
// previous error, awaits fn, and stores err.message if it throws (or hands
// the error to `onError` for callers that branch on it, e.g. a 429).
// Resolves to true on success, false on failure; put follow-up work (close
// the modal, update the list) inside fn so it only runs on success.
export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn, { onError } = {}) => {
    setPending(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      if (onError) onError(err);
      else setError(err.message);
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  return { run, pending, error, setError };
}
