import { useState } from "react";
import Modal, { ModalClose } from "@/components/ui/Modal";
import Message from "@/components/ui/Message";
import PostSearchInput from "./PostSearchInput";
import PostSearchResults from "./PostSearchResults";
import { usePostSearch } from "@/lib/post/usePostSearch";

// Opened from the header's search icon. Clicking a result hands the post up
// to the caller, which is expected to close this modal and open that post.
function SearchModal({ onClose, onSelectPost }) {
  const [query, setQuery] = useState("");
  const { results, loading, error } = usePostSearch(query);

  return (
    <Modal onClose={onClose} align="top" className="max-w-xl p-4">
      <div className="flex items-center gap-2">
        <PostSearchInput value={query} onChange={setQuery} />
        <ModalClose onClose={onClose} label="Close search" />
      </div>

      <div className="mt-3 max-h-[50vh] overflow-y-auto sm:max-h-96">
        {error ? (
          <Message tone="error" className="px-3 py-2">{error}</Message>
        ) : (
          <PostSearchResults query={query} results={results} loading={loading} onSelect={onSelectPost} />
        )}
      </div>
    </Modal>
  );
}

export default SearchModal;
