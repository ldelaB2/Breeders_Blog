import { useEffect } from "react";

// Shared popup shell: dimmed backdrop, closes on backdrop click or Escape.
// `align="top"` pins the panel near the top of the viewport (search) instead
// of centering it; `className` sizes the panel (e.g. "max-w-lg").
function Modal({ onClose, align = "center", className = "", children }) {
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex justify-center bg-black/40 px-4 ${
        align === "top" ? "items-start pt-12 sm:pt-24" : "items-center"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className={`w-full rounded-lg bg-white shadow-xl ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default Modal;
