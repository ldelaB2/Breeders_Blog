import { useRef } from "react";

// How long to wait after the last call for a given id before actually
// syncing to the server. Long enough that a rapid burst of clicks (e.g.
// spam-clicking vote) collapses into a single request instead of one per
// click; short enough that a single deliberate click still feels instant
// (the optimistic UI update already happened - this only delays the
// network call).
const SYNC_DELAY_MS = 400;

// Shared helper for "update the UI now, sync with the server in the
// background" actions on a flat array of items keyed by id. patch() merges
// a partial update in place (used once the real server response arrives).
// optimisticUpdate() does the same but first captures the item's previous
// value, returning a rollback() that restores it exactly if the background
// request fails - so a failed vote/pin snaps back to its real prior state
// instead of just re-toggling (which would be wrong when the toggle also
// switched between up/down rather than just clearing one).
export function useOptimisticList(setItems) {
  // Tracks the latest request sequence number per item id, so a stale
  // response (e.g. an upvote request that's still in flight when the user
  // quickly downvotes) can be told apart from the most recent one.
  const requestSeq = useRef({});
  // Pending debounce timers per id.
  const timers = useRef({});
  // Whether a request is currently in flight for an id, so a newer call
  // never overlaps it - it waits and is sent as a single follow-up once
  // the in-flight one settles.
  const sending = useRef({});
  // The most recent { seq, rollback, apiCall, onError } for an id, i.e.
  // the desired end state still waiting to be synced.
  const latest = useRef({});

  function patch(id, updater) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updater(item) } : item)));
  }

  function optimisticUpdate(id, updater) {
    let previous;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        previous = item;
        return { ...item, ...updater(item) };
      })
    );
    return () => previous && patch(id, () => previous);
  }

  async function send(id) {
    if (sending.current[id]) return; // already sending - it'll pick up `latest` when done
    const call = latest.current[id];
    if (!call) return;

    sending.current[id] = true;
    try {
      const updated = await call.apiCall();
      if (requestSeq.current[id] === call.seq) patch(id, () => updated);
    } catch (err) {
      if (requestSeq.current[id] === call.seq) {
        call.rollback();
        call.onError?.(err.message);
      }
    } finally {
      sending.current[id] = false;
      // A newer call arrived while this one was in flight - send the
      // latest desired state now, as a single follow-up request.
      if (requestSeq.current[id] !== call.seq) send(id);
    }
  }

  // Combines optimisticUpdate with the async round trip: applies the
  // optimistic change immediately, then debounces the actual network call
  // so rapid repeated calls for the same id (e.g. spam-clicking a vote
  // button) never produce more than one in-flight request at a time and
  // only ever sync the final state the user settled on - not one request
  // per click, and never overlapping requests that could race on the
  // server. Once the real response lands, it's applied (or rolled back on
  // failure) unless a newer call has since superseded it, which avoids the
  // vote visibly flickering back and forth between stale and current state.
  function runOptimistic(id, updater, apiCall, onError) {
    const seq = (requestSeq.current[id] || 0) + 1;
    requestSeq.current[id] = seq;

    const rollback = optimisticUpdate(id, updater);
    latest.current[id] = { seq, rollback, apiCall, onError };

    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => send(id), SYNC_DELAY_MS);
  }

  return { patch, runOptimistic };
}
