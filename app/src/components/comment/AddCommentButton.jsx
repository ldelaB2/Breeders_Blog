import Icon from "../Icon";
import addCommentIcon from "../../assets/add_comment.svg?raw";

// "+" toggle for revealing an AddCommentForm. Kept separate from the form so
// the button can stay in a comment's header row while the form renders
// further down, below the comment text.
function AddCommentButton({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add comment"
      aria-expanded={open}
      className="rounded-md p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      <Icon svg={addCommentIcon} className="h-4 w-4" />
    </button>
  );
}

export default AddCommentButton;
