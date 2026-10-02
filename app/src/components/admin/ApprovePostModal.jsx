import { useState } from "react";
import Modal, { ModalActions } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FilePicker from "@/components/ui/FilePicker";
import Message from "@/components/ui/Message";
import ShareImagePicker from "@/components/post/ShareImagePicker";
import { useApi } from "@/lib/api/useApi";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { uploadToSignedUrl } from "@/lib/post/upload";

// The extension check mirrors the post-html bucket's text/html restriction
// so a wrong file fails fast; the bucket is the enforcement.
const FILE_RULES = { extensions: ["html", "htm"], typeLabel: "an .html file" };

const STATUS_LABELS = { uploading: "Uploading…", finalizing: "Finalizing…" };

// Popup for approving a pending post: uploads the moderator-stitched HTML
// file (and optionally a share image replacing the author's) straight to
// storage via signed URLs, then tells the backend to finalize.
function ApprovePostModal({ post, onClose, onApproved }) {
  const api = useApi();
  const { run, pending, error, setError } = useAsyncAction();
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState(null); // "uploading" | "finalizing" while pending

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose the stitched HTML file");
      return;
    }

    run(async () => {
      setStatus("uploading");
      const urls = await api.getApproveUploadUrl(post.id, image?.name);
      await Promise.all([
        uploadToSignedUrl(urls.signedUrl, file, "text/html"),
        urls.image && uploadToSignedUrl(urls.image.signedUrl, image, urls.image.contentType),
      ]);

      setStatus("finalizing");
      const updated = await api.approvePost(post.id, urls.image?.slug);
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
          rules={FILE_RULES}
          placeholder="Upload stitched HTML file…"
          onSelect={(selected) => {
            setError(null);
            setFile(selected);
          }}
          onError={setError}
        />

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="The author's share image"
            className="max-h-40 w-full rounded-md border border-gray-200 object-contain"
          />
        )}

        <ShareImagePicker
          label={post.imageUrl ? "Replace share image (optional)" : undefined}
          file={image}
          placeholder={post.imageUrl ? "Keep the author's image, or upload a new one…" : "Upload a figure from the post…"}
          onSelect={(selected) => {
            setError(null);
            setImage(selected);
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
