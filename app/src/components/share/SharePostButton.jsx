import { useState } from "react";
import IconButton from "@/components/ui/IconButton";
import ShareModal from "./ShareModal";

// Sits in the post header next to Back — mirrors its styling so the title
// block stays visually centered between the two.
function SharePostButton({ post }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton icon="share" label="Share" size="lg" tone="strong" className="shrink-0" onClick={() => setOpen(true)} />
      {open && <ShareModal post={post} onClose={() => setOpen(false)} />}
    </>
  );
}

export default SharePostButton;
