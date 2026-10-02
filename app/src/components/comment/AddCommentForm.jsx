import { useState } from "react";
import Button from "@/components/ui/Button";
import { FIELD_CLASS } from "@/components/ui/TextField";
import { cn } from "@/lib/utils/cn";

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
        className={cn(FIELD_CLASS, "w-full p-2 text-sm text-gray-700")}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          Post
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default AddCommentForm;
