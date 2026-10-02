import { useState } from "react";
import Modal, { ModalActions } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FilePicker from "@/components/ui/FilePicker";
import Message from "@/components/ui/Message";
import TextField from "@/components/ui/TextField";
import ShareImagePicker from "./ShareImagePicker";
import { useApi } from "@/lib/api/useApi";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { formatMB, uploadToSignedUrl } from "@/lib/post/upload";

// These mirror the limits in backend/src/config/limits.js so a bad
// input fails fast with a clear message; the backend is the enforcement.
const TITLE_LIMIT = 100;
const ABSTRACT_LIMIT = 3800; // ~600 words
const FILE_RULES = {
  extensions: ["md", "qmd", "rmd", "zip"],
  maxBytes: 50 * 1024 * 1024,
  typeLabel: "a .md, .qmd, .rmd, or .zip file",
};
const POST_LIMIT = 5; // per 24 hours; only used for the message text

// Popup for submitting a new post: title, abstract, a single raw file
// (.md/.qmd/.rmd/.zip) and an optional share image. The files go straight
// to storage via signed URLs (POST /posts/upload-url), then POST /posts
// finalizes. The post is created PENDING - invisible to everyone but its
// author and a moderator/admin until reviewed.
function CreatePostModal({ topicSlug, onClose, onCreated }) {
  const api = useApi();
  const { run, pending, error, setError } = useAsyncAction();
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  const canSubmit = Boolean(title.trim() && abstract.trim() && file);

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      setError("Title, abstract, and a file are all required");
      return;
    }

    run(
      async () => {
        const ticket = await api.getPostUploadUrl(file.name, image?.name);
        await Promise.all([
          uploadToSignedUrl(ticket.signedUrl, file, ticket.contentType),
          ticket.image && uploadToSignedUrl(ticket.image.signedUrl, image, ticket.image.contentType),
        ]);

        const created = await api.createPost({
          id: ticket.postId,
          topicSlug,
          title: title.trim(),
          abstract: abstract.trim(),
          rawSlug: ticket.rawSlug,
          imageSlug: ticket.image?.slug,
          originalFilename: file.name,
        });
        onCreated(created);
        onClose();
      },
      { onError: (err) => (err.status === 429 ? setLimitReached(true) : setError(err.message)) },
    );
  }

  if (limitReached) {
    return (
      <Modal onClose={onClose} title="Post limit reached" className="max-w-lg p-6">
        <p className="text-sm text-gray-700">
          You can submit up to {POST_LIMIT} posts every 24 hours. Please try again later.
        </p>
        <ModalActions>
          <Button onClick={onClose}>Got it</Button>
        </ModalActions>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Create a new post" className="max-w-lg p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Message tone="error">{error}</Message>}

        <TextField label="Title" value={title} onChange={setTitle} limit={TITLE_LIMIT} required />
        <TextField label="Abstract" value={abstract} onChange={setAbstract} limit={ABSTRACT_LIMIT} multiline required />

        <FilePicker
          label="Post file"
          file={file}
          rules={FILE_RULES}
          placeholder="Upload .md, .qmd, .rmd, or .zip file…"
          hint={`.md, .qmd, .rmd, or .zip, up to ${formatMB(FILE_RULES.maxBytes)}`}
          onSelect={(selected) => {
            setError(null);
            setFile(selected);
          }}
          onError={setError}
        />

        <ShareImagePicker
          file={image}
          placeholder="Upload a figure from your post…"
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
          <Button type="submit" disabled={pending || !canSubmit}>
            {pending ? "Submitting…" : "Submit"}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export default CreatePostModal;
