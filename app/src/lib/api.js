import { useAuth } from "@clerk/react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// Public reads - usable without a session token. fetchPosts optionally takes
// one anyway: the backend includes a caller's own pending posts in the feed
// only when it knows who's asking (see GET /posts in posts.routes.js).
export const fetchPosts = (topicSlug, token) =>
  request(`/posts${topicSlug ? `?topicSlug=${encodeURIComponent(topicSlug)}` : ""}`, { token });
export const fetchTopPosts = (limit, token) =>
  request(`/posts/top${limit ? `?limit=${limit}` : ""}`, { token });
export const searchPosts = (q, token) => request(`/posts/search?q=${encodeURIComponent(q)}`, { token });
export const fetchPost = (id) => request(`/posts/${id}`);
export const fetchComments = (postId) => request(`/posts/${postId}/comments`);

// Streams the zip directly rather than going through the shared JSON
// `request()` helper, then triggers a browser save via a temporary
// object-URL anchor.
export async function downloadPostZip(id, token) {
  const res = await fetch(`${BASE_URL}/posts/${id}/download`, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${id}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

// Bundles the reads above with authenticated write actions, attaching the
// current Clerk session token automatically.
export function useApi() {
  const { getToken } = useAuth();

  async function authed(path, opts) {
    const token = await getToken();
    return request(path, { ...opts, token });
  }

  return {
    fetchPosts: async (topicSlug) => fetchPosts(topicSlug, (await getToken()) || undefined),
    fetchTopPosts: async (limit) => fetchTopPosts(limit, (await getToken()) || undefined),
    searchPosts: async (q) => searchPosts(q, (await getToken()) || undefined),
    fetchPost,
    fetchComments,
    fetchCurrentUser: () => authed("/me"),
    fetchPendingPosts: () => authed("/posts/pending"),
    fetchPins: () => authed("/me/pins"),
    fetchRecommendations: () => authed("/me/recommendations"),
    downloadPost: async (id) => downloadPostZip(id, await getToken()),
    getApproveUploadUrl: (id) => authed(`/posts/${id}/approve/upload-url`, { method: "POST" }),
    approvePost: (id) => authed(`/posts/${id}/approve`, { method: "POST" }),
    rejectPost: (id, rejectionReason) =>
      authed(`/posts/${id}/reject`, { method: "POST", body: { rejectionReason } }),
    createPost: (data) => authed("/posts", { method: "POST", body: data }),
    upvotePost: (id) => authed(`/posts/${id}/upvote`, { method: "POST" }),
    downvotePost: (id) => authed(`/posts/${id}/downvote`, { method: "POST" }),
    pinPost: (id) => authed(`/posts/${id}/pin`, { method: "POST" }),
    lockPost: (id) => authed(`/posts/${id}/lock`, { method: "POST" }),
    archivePost: (id) => authed(`/posts/${id}/archive`, { method: "POST" }),
    deletePost: (id) => authed(`/posts/${id}`, { method: "DELETE" }),
    createComment: (postId, data) => authed(`/posts/${postId}/comments`, { method: "POST", body: data }),
    deleteComment: (id) => authed(`/comments/${id}`, { method: "DELETE" }),
    restoreComment: (id) => authed(`/comments/${id}/restore`, { method: "POST" }),
    upvoteComment: (id) => authed(`/comments/${id}/upvote`, { method: "POST" }),
    downvoteComment: (id) => authed(`/comments/${id}/downvote`, { method: "POST" }),
  };
}
