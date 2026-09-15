import { useState } from "react";
import { useApi } from "../../lib/api";

// Confirmation popup for permanently deleting a post. Deliberately requires
// this explicit click-through rather than a bare window.confirm - the
// action is irreversible (unlike archive) and removes the post's comments,
// votes, and pins along with it.
function DeletePostModal({ post, onClose, onDeleted }) {
  const api = useApi();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await api.deletePost(post.id);
      onDeleted(post.id);
      onClose();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-gray-900">Delete post</h2>
        <p className="mb-4 truncate text-sm text-gray-500">{post.title}</p>

        <p className="text-sm text-gray-700">
          This permanently deletes the post along with all of its comments, votes, and pins. This
          can't be undone.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-md bg-red-600 px-4 py-1.5 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? "Deleting…" : "Delete post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeletePostModal;
