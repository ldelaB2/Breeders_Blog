import { useEffect } from "react";

// Calls onOutside when a mousedown lands outside `ref`'s element - closes
// dropdowns and popovers when the user clicks elsewhere. Only listens while
// `enabled`.
export function useClickOutside(ref, onOutside, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function onMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [ref, onOutside, enabled]);
}
