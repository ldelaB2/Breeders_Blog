import { useState } from "react";
import Icon from "../../Icon";
import ShareModal from "./ShareModal";
import shareIcon from "../../../assets/share.svg?raw";

// Sits in the post header next to Back — mirrors its styling so the title
// block stays visually centered between the two.
function SharePostButton({ post }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Share"
        className="shrink-0 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Icon svg={shareIcon} className="h-6 w-6" />
      </button>

      {open && <ShareModal post={post} onClose={() => setOpen(false)} />}
    </>
  );
}

export default SharePostButton;
