import { useState } from "react";
import Modal, { ModalActions } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FilePicker from "@/components/ui/FilePicker";
import Message from "@/components/ui/Message";
import { useApi } from "@/lib/api/useApi";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { uploadToSignedUrl } from "@/lib/post/upload";

// The extension check mirrors the post-html bucket's text/html restriction
// so a wrong file fails fast; the bucket is the enforcement.
const FILE_RULES = { extensions: ["html", "htm"], typeLabel: "an .html file" };

const STATUS_LABELS = { uploading: "Uploading…", finalizing: "Finalizing…" };

// Popup for approving a pending post: uploads the moderator-stitched HTML
// file straight to storage via a signed URL, then tells the backend to
// finalize.
function ApprovePostModal({ post, onClose, onApproved }) {
  const api = useApi();
  const { run, pending, error, setError } = useAsyncAction();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // "uploading" | "finalizing" while pending

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose the stitched HTML file");
      return;
    }

    run(async () => {
      setStatus("uploading");
      const { signedUrl } = await api.getApproveUploadUrl(post.id);
      await uploadToSignedUrl(signedUrl, file, "text/html");

      setStatus("finalizing");
      const updated = await api.approvePost(post.id);
      onApproved(updated);
      onClose();
    });
  }

  return (
    <Modal onClose={onClose} title="Approve post" subtitle={post.title} className="max-w-lg p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Message tone="error">{error}</Message>}

        <FilePicker
          label="Stitched HTML file"
          file={file}
          accept=".html,text/html"
          rules={FILE_RULES}
          placeholder="Upload stitched HTML file…"
          onSelect={(selected) => {
            setError(null);
            setFile(selected);
          }}
          onError={setError}
        />

        <ModalActions spacing="mt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? STATUS_LABELS[status] : "Upload & Approve"}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export default ApprovePostModal;
