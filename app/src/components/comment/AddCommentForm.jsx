import { useState } from "react";

// Wide inline textarea for composing a new comment or reply.
function AddCommentForm({ onSubmit, onCancel }) {
  const [text, setText] = useState("");
  // Guards against a fast double-click/double-tap (or mashing Enter) firing
  // two create-comment requests from the same form instance before the
  // first has even had a chance to close it.
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    onSubmit(text.trim());
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex w-full flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoFocus
        placeholder="Write a comment..."
        className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gray-900 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          Post
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default AddCommentForm;
