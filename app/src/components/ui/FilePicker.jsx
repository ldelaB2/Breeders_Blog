import { useRef } from "react";
import { validateFile } from "@/lib/post/upload";

// Labeled single-file chooser: a dashed button standing in for the native
// (hidden) file input, showing the chosen file's name once picked. The file
// is checked against `rules` ({ extensions, maxBytes, typeLabel } - see
// validateFile) before onSelect sees it; a bad file goes to onError
// instead, and the input is reset so the same file can be re-chosen after
// fixing it.
function FilePicker({ label, file, accept, rules, placeholder, hint, onSelect, onError }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const error = validateFile(selected, rules);
    if (error) {
      onError(error);
      e.target.value = "";
      return;
    }
    onSelect(selected);
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full truncate rounded-md border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
      >
        {file?.name || placeholder}
      </button>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default FilePicker;
