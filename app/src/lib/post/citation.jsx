import { useSyncExternalStore } from "react";

// The post currently open in PostReader ({ title, author, date }), or null.
// The footer's "Cite this page" line lives outside the route tree and has
// no other way to learn about the post - a tiny store beats a context
// provider for a single value with a single writer.
let current = null;
const listeners = new Set();

export function setCitation(citation) {
  current = citation;
  listeners.forEach((fn) => fn());
}

export function useCitation() {
  return useSyncExternalStore(
    (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    () => current
  );
}
