// Shared helper for "update the UI now, sync with the server in the
// background" actions on a flat array of items keyed by id. patch() merges
// a partial update in place (used once the real server response arrives).
// optimisticUpdate() does the same but first captures the item's previous
// value, returning a rollback() that restores it exactly if the background
// request fails - so a failed vote/pin snaps back to its real prior state
// instead of just re-toggling (which would be wrong when the toggle also
// switched between up/down rather than just clearing one).
export function useOptimisticList(setItems) {
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

  return { patch, optimisticUpdate };
}
