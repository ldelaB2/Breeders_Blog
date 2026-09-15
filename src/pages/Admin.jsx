import { useState, useEffect } from "react";
import { useCurrentUser } from "../lib/useCurrentUser";
import { useApi } from "../lib/api";
import AdminPostRow from "../components/post/AdminPostRow";
import ApprovePostModal from "../components/post/ApprovePostModal";

// Admin-only moderation queue. Access is enforced twice: here (so a
// non-admin never even sees the UI or triggers the fetch) and, more
// importantly, on every endpoint this page calls (requireRole("ADMIN") in
// posts.routes.js) - the frontend check is a UX nicety, not the boundary.
export default function Admin() {
  const { isAdmin, loading: roleLoading } = useCurrentUser();
  const api = useApi();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingPost, setApprovingPost] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    api
      .fetchPendingPosts()
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function removePost(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleReject(id, reason) {
    await api.rejectPost(id, reason);
    removePost(id);
  }

  if (roleLoading) return <p className="p-8 text-gray-500">Loading…</p>;
  if (!isAdmin) return <p className="p-8 text-gray-500">You don't have access to this page.</p>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Control</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading pending posts…</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">No pending posts.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <AdminPostRow
              key={post.id}
              post={post}
              onDownload={api.downloadPost}
              onReject={handleReject}
              onApprove={setApprovingPost}
            />
          ))}
        </div>
      )}

      {approvingPost && (
        <ApprovePostModal
          post={approvingPost}
          onClose={() => setApprovingPost(null)}
          onApproved={(updated) => removePost(updated.id)}
        />
      )}
    </div>
  );
}
