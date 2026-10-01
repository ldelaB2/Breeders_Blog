import IconButton from "./IconButton";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";
import { cn } from "@/lib/utils/cn";

// Shared popup shell: dimmed backdrop, closes on backdrop click or Escape.
// `title`/`subtitle` render the standard header, and `showClose` adds an X
// button to it. `align="top"` pins the panel near the top of the viewport
// (search) instead of centering it; `className` sizes the panel (e.g.
// "max-w-lg p-6").
function Modal({ onClose, title, subtitle, showClose = false, align = "center", className, children }) {
  useEscapeKey(onClose);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex justify-center bg-black/40 px-4",
        align === "top" ? "items-start pt-12 sm:pt-24" : "items-center",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className={cn("w-full rounded-lg bg-white shadow-xl", className)} onClick={(e) => e.stopPropagation()}>
        {(title || showClose) && (
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
              {subtitle && <p className="mt-1 truncate text-sm text-gray-500">{subtitle}</p>}
            </div>
            {showClose && <ModalClose onClose={onClose} />}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalClose({ onClose, label = "Close" }) {
  return <IconButton icon="close" label={label} size="lg" iconClassName="h-5 w-5" onClick={onClose} />;
}

// Right-aligned footer row for a modal's buttons (Cancel + confirm).
// `spacing` is the gap above it; inside a gap-4 form, "mt-2" gives the same
// total space as the default.
export function ModalActions({ spacing = "mt-6", children }) {
  return <div className={cn("flex justify-end gap-2", spacing)}>{children}</div>;
}

export default Modal;
