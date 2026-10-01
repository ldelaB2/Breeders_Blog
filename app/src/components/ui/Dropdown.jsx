import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "@/lib/hooks/useClickOutside";
import { cn } from "@/lib/utils/cn";

// A trigger plus a floating panel that closes on an outside click.
// `renderTrigger({ open, toggle })` draws the button; `children(close)` draws
// the panel contents and gets `close` for items that should dismiss it.
// `as="li"` lets it sit directly inside a nav list.
function Dropdown({ renderTrigger, children, align = "left", as: Tag = "div", panelClassName, panelProps }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  return (
    <Tag ref={ref} className="relative">
      {renderTrigger({ open, toggle: () => setOpen((prev) => !prev) })}
      {open && (
        <div
          className={cn(
            "absolute top-full z-20 mt-2 rounded-md border border-gray-200 bg-white py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
          {...panelProps}
        >
          {children(close)}
        </div>
      )}
    </Tag>
  );
}

export default Dropdown;
