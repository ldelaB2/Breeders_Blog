import { useEffect } from "react";
import { recordPostView } from "@/lib/api/client";

// Counts a view toward an approved post's rank, once per post per browser
// session (the flag is set before sending, so StrictMode's double effect
// and reloads don't recount). Best-effort: storage or network failures are
// ignored. Pass null while the post is loading.
export function useRecordPostView(post) {
  const viewableId = post?.status === "APPROVED" ? post.id : null;

  useEffect(() => {
    if (!viewableId) return;
    const key = `viewed:${viewableId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: count it anyway.
    }
    recordPostView(viewableId).catch(() => {});
  }, [viewableId]);
}
