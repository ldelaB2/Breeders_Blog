import { useEffect, useState } from "react";

// The parent side of the iframe bridge in postHtml.jsx. The post iframe is
// sandboxed with an opaque origin, so it reports its content height (so it
// never needs its own scrollbar) and "scroll to this heading" requests via
// postMessage. The page has a single scrollable area - the window - so a
// jump means scrolling the window to the heading's absolute position.
// goToSection(id) sends a TOC click the other way.
export function usePostFrame(iframeRef) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    function onMessage(event) {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;
      const { type, height, top } = event.data ?? {};
      if (type === "post-height") setHeight(height);
      if (type === "post-scroll") {
        window.scrollTo({ top: window.scrollY + iframe.getBoundingClientRect().top + top - 16, behavior: "smooth" });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [iframeRef]);

  function goToSection(id) {
    iframeRef.current?.contentWindow?.postMessage({ type: "post-goto", id }, "*");
  }

  return { height, goToSection };
}
