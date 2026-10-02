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

// One full-width row in a Dropdown panel: a button by default, or any
// element/component via `as` (e.g. as={Link} with `to`). Children may
// lead with an <Icon>; the row spaces them out.
export function DropdownItem({ as: Tag = "button", className, ...props }) {
  return (
    <Tag
      {...(Tag === "button" && { type: "button" })}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900",
        className,
      )}
      {...props}
    />
  );
}

export default Dropdown;
