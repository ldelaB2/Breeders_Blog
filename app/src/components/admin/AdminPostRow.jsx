import { useState } from "react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Message from "@/components/ui/Message";
import { FIELD_CLASS } from "@/components/ui/TextField";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { cn } from "@/lib/utils/cn";

// One row in the Admin Control queue: a static (non-interactive) post
// preview on the left, moderation controls on the right. Approving opens
// a modal (handled by the parent via onApprove) to collect the stitched
// HTML file; rejecting happens directly from here once a reason is typed.
function AdminPostRow({ post, onDownload, onReject, onApprove }) {
  const [decision, setDecision] = useState("APPROVE");
  const [reason, setReason] = useState("");
  // Separate actions, so a download doesn't show as "Submitting…". They
  // share one error line: starting either clears both.
  const submit = useAsyncAction();
  const download = useAsyncAction();
  const error = submit.error || download.error;

  function clearErrors() {
    submit.setError(null);
    download.setError(null);
  }

  function handleSubmit() {
    clearErrors();
    if (decision === "APPROVE") {
      onApprove(post);
      return;
    }
    if (!reason.trim()) {
      submit.setError("A rejection reason is required");
      return;
    }
    submit.run(() => onReject(post.id, reason.trim()));
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-canvas-border bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate font-bold text-gray-900">{post.title}</h3>
          <span className="shrink-0 text-sm text-gray-500">{post.authorName}</span>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-gray-600">{post.abstract}</p>
        {error && <Message tone="error" className="mt-2">{error}</Message>}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <IconButton
          icon="download"
          label="Download post files"
          disabled={download.pending}
          onClick={() => {
            clearErrors();
            download.run(() => onDownload(post.id));
          }}
        />

        <div className="flex items-center gap-2">
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className={cn(FIELD_CLASS, "p-1.5 text-sm text-gray-700")}
          >
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
          </select>
          <Button onClick={handleSubmit} disabled={submit.pending}>
            {submit.pending ? "Submitting…" : "Submit"}
          </Button>
        </div>

        {decision === "REJECT" && (
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Rejection reason"
            className={cn(FIELD_CLASS, "w-48 p-1.5 text-sm text-gray-900")}
          />
        )}
      </div>
    </div>
  );
}

export default AdminPostRow;
