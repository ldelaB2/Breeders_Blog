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

// Public reads - never need a session token.
export const fetchPosts = (topicSlug) =>
  request(`/posts${topicSlug ? `?topicSlug=${encodeURIComponent(topicSlug)}` : ""}`);
export const fetchPost = (id) => request(`/posts/${id}`);
export const fetchComments = (postId) => request(`/posts/${postId}/comments`);

// Bundles the reads above with authenticated write actions, attaching the
// current Clerk session token automatically.
export function useApi() {
  const { getToken } = useAuth();

  async function authed(path, opts) {
    const token = await getToken();
    return request(path, { ...opts, token });
  }

  return {
    fetchPosts,
    fetchPost,
    fetchComments,
    createPost: (data) => authed("/posts", { method: "POST", body: data }),
    upvotePost: (id) => authed(`/posts/${id}/upvote`, { method: "POST" }),
    downvotePost: (id) => authed(`/posts/${id}/downvote`, { method: "POST" }),
    pinPost: (id) => authed(`/posts/${id}/pin`, { method: "POST" }),
    createComment: (postId, data) => authed(`/posts/${postId}/comments`, { method: "POST", body: data }),
    deleteComment: (id) => authed(`/comments/${id}`, { method: "DELETE" }),
    upvoteComment: (id) => authed(`/comments/${id}/upvote`, { method: "POST" }),
    downvoteComment: (id) => authed(`/comments/${id}/downvote`, { method: "POST" }),
  };
}
