import { useEffect, useRef, useState } from "react";
import Icon from "../../Icon";
import ShareProviderButton from "./ShareProviderButton";
import moreIcon from "../../../assets/more.svg?raw";

// The share modal's 5th slot: a "more" trigger that reveals whichever
// providers don't fit in the main row. This isn't a provider itself (no
// `activate`/`kind`) — pure UI chrome, so it's never registered in
// providers/index.js.
function MoreShareMenu({ providers, post, origin, showToast }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="More share options"
        aria-haspopup="menu"
        aria-expanded={open}
        title="More"
        className="flex w-full flex-col items-center gap-1 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Icon svg={moreIcon} className="h-6 w-6" />
        <span className="text-[11px] text-gray-500">More</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-2 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {providers.map((provider) => (
            <ShareProviderButton
              key={provider.id}
              provider={provider}
              post={post}
              origin={origin}
              showToast={showToast}
              variant="row"
              onAfterActivate={() => setOpen(false)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MoreShareMenu;
