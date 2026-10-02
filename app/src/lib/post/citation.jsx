import { useEffect, useSyncExternalStore } from "react";

// The post currently open in PostReader ({ title, author, date }), or null.
// The footer's "Cite this page" line lives outside the route tree and has
// no other way to learn about the post - a tiny store beats a context
// provider for a single value with a single writer.
let current = null;
const listeners = new Set();

function setCitation(citation) {
  current = citation;
  listeners.forEach((fn) => fn());
}

export function useCitation() {
  return useSyncExternalStore(
    (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    () => current
  );
}

// The writer side: points the citation at `post` while it's open (null
// while loading) and reverts it on the way out.
export function useCitePost(post) {
  useEffect(() => {
    if (!post) return;
    setCitation({ title: post.title, author: post.authorName, date: post.createdAt });
    return () => setCitation(null);
  }, [post]);
}
