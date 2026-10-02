import Icon from "./Icon";
import { cn } from "@/lib/utils/cn";

// Padding + icon size, in step.
const SIZES = {
  sm: ["p-1", "h-4 w-4"],
  md: ["p-1.5", "h-5 w-5"],
  lg: ["p-2", "h-6 w-6"],
};

const TONES = {
  neutral: "text-gray-500 hover:bg-gray-100", // close, download
  strong: "text-gray-600 hover:bg-gray-100", // back, share
  subtle: "text-gray-300 hover:bg-gray-100 hover:text-gray-600", // secondary tile actions
  danger: "text-gray-300 hover:bg-red-50 hover:text-red-600", // delete/remove
  // On/off state (pin, lock): amber while `pressed`.
  toggle: (pressed) => cn("hover:bg-gray-100", pressed ? "text-amber-500" : "text-gray-300"),
};

// A square button showing a single icon. `label` is required - it's the
// accessible name, since there's no visible text. `pressed` makes it a
// toggle (aria-pressed). `stopPropagation` is for buttons inside a
// clickable card (post tiles), so the click doesn't also open the card.
// `iconClassName` replaces the size's icon classes (e.g. a responsive size).
// `disabled` (e.g. while its action is pending) dims it with a wait cursor.
function IconButton({
  icon,
  label,
  size = "md",
  tone = "neutral",
  pressed,
  stopPropagation = false,
  className,
  iconClassName,
  onClick,
  ...props
}) {
  const [padding, iconSize] = SIZES[size];
  const toneClass = typeof TONES[tone] === "function" ? TONES[tone](pressed) : TONES[tone];

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onClick?.(e);
      }}
      className={cn("rounded-md transition-colors disabled:cursor-wait disabled:opacity-50", padding, toneClass, className)}
      {...props}
    >
      <Icon name={icon} className={iconClassName ?? iconSize} />
    </button>
  );
}

export default IconButton;
