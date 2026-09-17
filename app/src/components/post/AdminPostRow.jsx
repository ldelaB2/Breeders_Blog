import { useState } from "react";
import Icon from "../Icon";
import downloadIcon from "../../assets/download.svg?raw";

// One row in the Admin Control queue: a static (non-interactive) post
// preview on the left, moderation controls on the right. Approving opens
// a modal (handled by the parent via onApprove) to collect the stitched
// HTML file; rejecting happens directly from here once a reason is typed.
function AdminPostRow({ post, onDownload, onReject, onApprove }) {
  const [decision, setDecision] = useState("APPROVE");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownload() {
    setError(null);
    try {
      await onDownload(post.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (decision === "APPROVE") {
      onApprove(post);
      return;
    }

    if (!reason.trim()) {
      setError("A rejection reason is required");
      return;
    }
    setSubmitting(true);
    try {
      await onReject(post.id, reason.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-canvas-border bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate font-bold text-gray-900">{post.title}</h3>
          <span className="shrink-0 text-sm text-gray-500">{post.authorName}</span>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-gray-600">{post.abstract}</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download post files"
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <Icon svg={downloadIcon} className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="rounded-md border border-gray-200 p-1.5 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
          >
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
          </select>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>

        {decision === "REJECT" && (
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Rejection reason"
            className="w-48 rounded-md border border-gray-200 p-1.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

export default AdminPostRow;
