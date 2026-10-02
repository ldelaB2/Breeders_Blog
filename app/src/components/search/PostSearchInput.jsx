import { FIELD_CLASS } from "@/components/ui/TextField";
import { cn } from "@/lib/utils/cn";

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
      className={cn(FIELD_CLASS, "w-full p-2.5 text-base text-gray-900")}
    />
  );
}

export default PostSearchInput;
