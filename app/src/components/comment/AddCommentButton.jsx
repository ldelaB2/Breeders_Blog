import IconButton from "@/components/ui/IconButton";

// "+" toggle for revealing an AddCommentForm. Kept separate from the form so
// the button can stay in a comment's header row while the form renders
// further down, below the comment text.
function AddCommentButton({ open, onClick }) {
  return (
    <IconButton
      icon="add-comment"
      label="Add comment"
      size="sm"
      tone={null}
      aria-expanded={open}
      className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      onClick={onClick}
    />
  );
}

export default AddCommentButton;
