import { useState, useRef } from "react";
import { useApi } from "../../lib/api";

// Popup for approving a pending post: uploads the moderator-stitched HTML
// file straight from the browser to Supabase Storage via a short-lived
// signed URL the backend mints, then tells the backend to finalize. The
// file never passes through our own server, so it isn't bounded by
// Vercel's ~4.5mb function request-body limit - only Supabase Storage's own
// (much larger) per-file limit applies.
// Matches the post-html Supabase Storage bucket's allowed_mime_types
// restriction (text/html only) - checked client-side too so an unsupported
// file fails fast with a clear message instead of a confusing upload error.
// The bucket's own MIME restriction is the actual source of truth/enforcement.
const ALLOWED_EXTENSIONS = ["html", "htm"];

function extensionOf(filename) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename ?? "");
  return match ? match[1].toLowerCase() : null;
}

function ApprovePostModal({ post, onClose, onApproved }) {
  const api = useApi();
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | finalizing

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = extensionOf(selected.name);
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`"${selected.name}" isn't a supported file type - choose an .html file`);
      e.target.value = "";
      return;
    }

    setError(null);
    setFileName(selected.name);
    setFile(selected);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose the stitched HTML file");
      return;
    }

    setError(null);
    try {
      setStatus("uploading");
      const { signedUrl } = await api.getApproveUploadUrl(post.id);
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "text/html", "x-upsert": "true" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

      setStatus("finalizing");
      const updated = await api.approvePost(post.id);
      onApproved(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("idle");
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
              disabled={status !== "idle"}
              className="rounded-md bg-gray-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              {status === "uploading" ? "Uploading…" : status === "finalizing" ? "Finalizing…" : "Upload & Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApprovePostModal;
