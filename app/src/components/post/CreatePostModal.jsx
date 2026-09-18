import { useState, useRef } from "react";
import { useApi } from "../../lib/api";

const TITLE_LIMIT = 100;
const ABSTRACT_LIMIT = 3800; // ~600 words
// Matches the backend's ALLOWED_UPLOAD_EXTENSIONS/MAX_UPLOAD_BYTES in
// backend/src/routes/posts.routes.js - checked client-side too so an
// unsupported/oversized file fails fast with a clear message instead of a
// confusing request error. The backend (and the storage bucket's own
// file_size_limit) is the actual source of truth/enforcement.
const ALLOWED_EXTENSIONS = ["md", "qmd", "rmd", "zip"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "50 MB";
// Matches the backend's POST_LIMIT in backend/src/routes/posts.routes.js -
// only used for the "you've hit your limit" message text, the backend is
// the actual source of truth/enforcement (a 429 response).
const POST_LIMIT = 5;

function extensionOf(filename) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename ?? "");
  return match ? match[1].toLowerCase() : null;
}

// Popup for submitting a new post: title, abstract, and a single raw file
// (.md/.qmd/.rmd/.zip). The file is uploaded directly to Supabase Storage via a
// short-lived signed URL the backend mints (POST /posts/upload-url), then
// POST /posts is called to finalize - mirroring ApprovePostModal's existing
// direct-upload pattern. The backend always creates the post with status
// PENDING - it stays invisible to everyone but its author and a
// moderator/admin until reviewed.
function CreatePostModal({ topicSlug, onClose, onCreated }) {
  const api = useApi();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = extensionOf(selected.name);
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`"${selected.name}" isn't a supported file type - choose a .md, .qmd, .rmd, or .zip file`);
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(`"${selected.name}" is too large - files must be under ${MAX_FILE_SIZE_LABEL}`);
      e.target.value = ""; // allow re-selecting the same file after trimming it
      return;
    }

    setError(null);
    setFile(selected);
  }

  const canSubmit = Boolean(title.trim() && abstract.trim() && file);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      setError("Title, abstract, and a file are all required");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { postId, rawSlug, signedUrl, contentType } = await api.getPostUploadUrl(file.name);
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType, "x-upsert": "true" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

      const created = await api.createPost({
        id: postId,
        topicSlug,
        title: title.trim(),
        abstract: abstract.trim(),
        rawSlug,
        originalFilename: file.name,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      if (err.status === 429) {
        setLimitReached(true);
      } else {
        setError(err.message);
      }
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
        {limitReached ? (
          <>
            <h2 className="mb-1 text-lg font-bold text-gray-900">Post limit reached</h2>
            <p className="mt-3 text-sm text-gray-700">
              You can submit up to {POST_LIMIT} posts every 24 hours. Please try again later.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-gray-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-700"
              >
                Got it
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-bold text-gray-900">Create a new post</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="post-title" className="text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <span className="text-xs text-gray-400">
                    {title.length}/{TITLE_LIMIT}
                  </span>
                </div>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
                  maxLength={TITLE_LIMIT}
                  required
                  className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-900 focus:border-transparent focus:outline-none"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="post-abstract" className="text-sm font-medium text-gray-700">
                    Abstract
                  </label>
                  <span className="text-xs text-gray-400">
                    {abstract.length}/{ABSTRACT_LIMIT}
                  </span>
                </div>
                <textarea
                  id="post-abstract"
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value.slice(0, ABSTRACT_LIMIT))}
                  maxLength={ABSTRACT_LIMIT}
                  rows={5}
                  required
                  className="w-full resize-none rounded-md border border-gray-200 p-2 text-sm text-gray-900 focus:border-transparent focus:outline-none"
                />
              </div>

              <div>
                <span className="mb-1 block text-sm font-medium text-gray-700">Post file</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.qmd,.rmd,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full truncate rounded-md border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {file?.name || "Upload .md, .qmd, .rmd, or .zip file…"}
                </button>
                <p className="mt-1 text-xs text-gray-400">.md, .qmd, .rmd, or .zip, up to {MAX_FILE_SIZE_LABEL}</p>
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
                  disabled={submitting || !canSubmit}
                  className="rounded-md bg-gray-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default CreatePostModal;
