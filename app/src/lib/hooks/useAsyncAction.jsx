import { useCallback, useRef, useState } from "react";

// The submit/delete/approve pattern: run(fn) flips `pending` on, clears the
// previous error, awaits fn, and stores err.message if it throws (or hands
// the error to `onError` for callers that branch on it, e.g. a 429).
// Resolves to true on success, false on failure; put follow-up work (close
// the modal, update the list) inside fn so it only runs on success.
//
// One run at a time: a run() while another is in flight is ignored
// (resolves false), so a double click can't submit twice. The guard is a
// ref because state wouldn't update between two clicks in the same tick.
// `cooldownMs` keeps it locked (and `pending` true) that long after each
// run - for lists where the row under the cursor changes once an action
// lands (see LinkPostModal).
export function useAsyncAction({ cooldownMs = 0 } = {}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const lockRef = useRef(false);

  const run = useCallback(
    async (fn, { onError } = {}) => {
      if (lockRef.current) return false;
      lockRef.current = true;
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
        const release = () => {
          lockRef.current = false;
          setPending(false);
        };
        if (cooldownMs) setTimeout(release, cooldownMs);
        else release();
      }
    },
    [cooldownMs],
  );

  return { run, pending, error, setError };
}
