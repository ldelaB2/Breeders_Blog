import { cn } from "@/lib/utils/cn";

// Every .svg in assets/icons, compiled by vite-plugin-svgr into a React
// component and keyed by file name - so dropping in "foo.svg" makes
// <Icon name="foo" /> available, no registration needed. The SVGs draw with
// currentColor, so an icon takes the text color of wherever it's placed,
// and have no width/height of their own, so className sizes them.
const ICONS = Object.fromEntries(
  Object.entries(
    import.meta.glob("/src/assets/icons/*.svg", { query: "?react", import: "default", eager: true }),
  ).map(([path, component]) => [path.split("/").pop().replace(".svg", ""), component]),
);

// `inline` is for an icon sitting inside a line of text.
function Icon({ name, className, inline = false }) {
  const Svg = ICONS[name];
  if (!Svg) throw new Error(`Unknown icon "${name}" - add assets/icons/${name}.svg`);
  return (
    <Svg aria-hidden="true" focusable="false" className={cn(inline ? "inline-block" : "block shrink-0", className)} />
  );
}

export default Icon;
