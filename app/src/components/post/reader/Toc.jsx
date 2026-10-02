import Collapsible from "@/components/ui/Collapsible";
import { cn } from "@/lib/utils/cn";

const HEADING = "On this page";

// The post's "On this page" table of contents (from extractPostHtml), in two
// layouts: a sticky sidebar on md+ screens and a collapsible bar above the
// post on mobile. `onSelect(id)` scrolls the post to that heading.

export function SidebarToc({ items, onSelect, offset }) {
  return (
    <nav
      className="sticky top-1/2 hidden w-48 shrink-0 self-start -translate-y-1/2 md:block"
      style={{ marginTop: offset }}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{HEADING}</p>
      <TocList items={items} onSelect={onSelect} />
    </nav>
  );
}

export function MobileToc({ items, onSelect }) {
  return (
    <Collapsible variant="panel" title={HEADING} className="mb-6 md:hidden">
      {(close) => (
        <TocList
          items={items}
          onSelect={(id) => {
            onSelect(id);
            close();
          }}
        />
      )}
    </Collapsible>
  );
}

// One entry per TOC node, recursing into nested entries (Quarto nests h3s
// etc. under their parent h2) with deeper levels indented.
function TocList({ items, onSelect, depth = 0 }) {
  return (
    <ul className={cn("flex flex-col gap-1 border-l border-canvas-border", depth > 0 && "ml-3")}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="block w-full truncate border-l-2 border-transparent px-3 py-1 text-left text-sm text-gray-600 transition-colors hover:border-accent hover:text-accent"
          >
            {item.text}
          </button>
          {item.children.length > 0 && <TocList items={item.children} onSelect={onSelect} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}
