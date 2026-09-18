import { useState, useRef } from "react";
import Modal from "../Modal";
import { useApi } from "../../lib/api";
import { extensionOf, uploadToSignedUrl } from "../../lib/upload";

// Popup for approving a pending post: uploads the moderator-stitched HTML
// file straight to storage via a signed URL, then tells the backend to
// finalize. The extension check mirrors the post-html bucket's text/html
// restriction so a wrong file fails fast; the bucket is the enforcement.
const ALLOWED_EXTENSIONS = ["html", "htm"];

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
      await uploadToSignedUrl(signedUrl, file, "text/html");

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
    <Modal onClose={onClose} className="max-w-lg p-6">
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
    </Modal>
  );
}

export default ApprovePostModal;
