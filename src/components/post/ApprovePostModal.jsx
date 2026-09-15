import { useState, useRef } from "react";
import { useApi } from "../../lib/api";

// Popup for approving a pending post: reads the moderator-stitched HTML
// file client-side (same FileReader-as-text pattern CreatePostModal.jsx
// uses for markdown) and sends its text as the `html` field.
function ApprovePostModal({ post, onClose, onApproved }) {
  const api = useApi();
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [html, setHtml] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setHtml(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!html.trim()) {
      setError("Please choose the stitched HTML file");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.approvePost(post.id, html);
      onApproved(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-gray-900">Approve post</h2>
        <p className="mb-4 truncate text-sm text-gray-500">{post.title}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">Stitched HTML file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,text/html"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full truncate rounded-md border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              {fileName || "Upload stitched HTML file…"}
            </button>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gray-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting ? "Uploading…" : "Upload & Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApprovePostModal;
