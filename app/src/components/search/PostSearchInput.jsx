// The search box shared by the header search and the link-posts modal.
// Focused on mount, since opening either modal means "I want to type".
function PostSearchInput({ value, onChange }) {
  return (
    <input
      autoFocus
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search posts by title or abstract…"
      className="w-full rounded-md border border-gray-200 p-2.5 text-base text-gray-900 focus:border-transparent focus:outline-none"
    />
  );
}

export default PostSearchInput;
