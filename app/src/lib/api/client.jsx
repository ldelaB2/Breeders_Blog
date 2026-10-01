const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

// Public reads - usable without a session token.
export const fetchPost = (id) => request(`/posts/${id}`);
export const fetchComments = (postId) => request(`/posts/${postId}/comments`);
export const recordPostView = (id) => request(`/posts/${id}/view`, { method: "POST" });

// Streams the zip directly rather than going through the JSON `request()`
// helper, then triggers a browser save via a temporary object-URL anchor.
async function downloadPostZip(id, token) {
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

const query = (key, value) => (value ? `?${key}=${encodeURIComponent(value)}` : "");

// Every API call, with the current Clerk session token attached (null when
// signed out). The list/search reads work anonymously but send the token
// anyway: the backend includes a caller's own pending posts only when it
// knows who's asking (see GET /posts in backend/src/modules/posts/feed.routes.js). Components get
// this through useApi().
export function createApi(getToken) {
  const get = async (path) => request(path, { token: await getToken() });
  const post = async (path, body) => request(path, { token: await getToken(), method: "POST", body });
  const del = async (path) => request(path, { token: await getToken(), method: "DELETE" });

  return {
    // Posts
    fetchPost,
    fetchPosts: (topicSlug) => get(`/posts${query("topicSlug", topicSlug)}`),
    fetchTopPosts: (limit) => get(`/posts/top${query("limit", limit)}`),
    fetchPendingPosts: () => get("/posts/pending"),
    searchPosts: (q) => get(`/posts/search?q=${encodeURIComponent(q)}`),
    getPostUploadUrl: (filename, imageFilename) => post("/posts/upload-url", { filename, imageFilename }),
    createPost: (data) => post("/posts", data),
    deletePost: (id) => del(`/posts/${id}`),
    upvotePost: (id) => post(`/posts/${id}/upvote`),
    downvotePost: (id) => post(`/posts/${id}/downvote`),
    pinPost: (id) => post(`/posts/${id}/pin`),
    lockPost: (id) => post(`/posts/${id}/lock`),
    archivePost: (id) => post(`/posts/${id}/archive`),

    // Linked posts
    fetchLinkedPosts: (postId) => get(`/posts/${postId}/links`),
    linkPost: (postId, targetPostId) => post(`/posts/${postId}/links`, { targetPostId }),
    unlinkPost: (postId, targetPostId) => del(`/posts/${postId}/links/${targetPostId}`),

    // Moderation
    downloadPost: async (id) => downloadPostZip(id, await getToken()),
    getApproveUploadUrl: (id, imageFilename) => post(`/posts/${id}/approve/upload-url`, { imageFilename }),
    approvePost: (id, imageSlug) => post(`/posts/${id}/approve`, { imageSlug }),
    rejectPost: (id, rejectionReason) => post(`/posts/${id}/reject`, { rejectionReason }),

    // Comments
    fetchComments,
    createComment: (postId, data) => post(`/posts/${postId}/comments`, data),
    deleteComment: (id) => del(`/comments/${id}`),
    restoreComment: (id) => post(`/comments/${id}/restore`),
    upvoteComment: (id) => post(`/comments/${id}/upvote`),
    downvoteComment: (id) => post(`/comments/${id}/downvote`),

    // Current user
    fetchCurrentUser: () => get("/me"),
    fetchPins: () => get("/me/pins"),
    fetchRecommendations: () => get("/me/recommendations"),
  };
}
