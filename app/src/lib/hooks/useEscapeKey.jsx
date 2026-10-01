import { useEffect } from "react";

export function useEscapeKey(onEscape) {
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onEscape();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onEscape]);
}
