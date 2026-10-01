import { useState } from "react";
import AdminPostRow from "@/components/admin/AdminPostRow";
import ApprovePostModal from "@/components/admin/ApprovePostModal";
import Message from "@/components/ui/Message";
import Page from "@/components/ui/Page";
import { useApi } from "@/lib/api/useApi";
import { useAsync } from "@/lib/hooks/useAsync";
import { useSeo } from "@/lib/seo/useSeo";

// Admin-only moderation queue. Access is enforced by RequireRole at the
// route level (role: "ADMIN" in config/routes.jsx) and, more importantly,
// on every endpoint this page calls (requireAdmin in
// backend/src/modules/moderation/moderation.routes.js) - so by the time
// this component mounts, the caller is already a confirmed admin.
export default function Admin() {
  const api = useApi();
  useSeo({ title: "Admin", noindex: true });

  const { data: posts, setData: setPosts, loading, error } = useAsync(() => api.fetchPendingPosts(), [api], {
    initialData: [],
  });
  const [approvingPost, setApprovingPost] = useState(null);

  const removePost = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

  async function handleReject(id, reason) {
    await api.rejectPost(id, reason);
    removePost(id);
  }

  return (
    <Page title="Admin Control">
      {error && <Message tone="error" className="mb-4">{error}</Message>}

      {loading ? (
        <Message>Loading pending posts…</Message>
      ) : posts.length === 0 ? (
        <Message>No pending posts.</Message>
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
    </Page>
  );
}
