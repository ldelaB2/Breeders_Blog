import { useState } from "react";
import Icon from "./Icon";
import { cn } from "@/lib/utils/cn";

// A header button that shows/hides its body. The body stays in the DOM
// while collapsed (hidden, not unmounted) so crawlers can still read it.
// `children` may be a function receiving `close`, for bodies whose items
// should collapse it again (e.g. a TOC link).
//
//   variant="section"  chevron before the title (About page sections)
//   variant="panel"    bordered full-width bar, chevron at the end (mobile TOC)
function Collapsible({ title, variant = "section", defaultOpen = false, className, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const close = () => setOpen(false);
  const body = typeof children === "function" ? children(close) : children;

  if (variant === "panel") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-md border border-canvas-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          {title}
          <Icon name="chevron" className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
        <div hidden={!open} className="rounded-b-md border border-t-0 border-canvas-border px-4 py-3">
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <Icon name="chevron" className={cn("h-4 w-4 text-gray-500 transition-transform", !open && "-rotate-90")} />
        {title}
      </button>
      <div hidden={!open}>{body}</div>
    </div>
  );
}

export default Collapsible;
