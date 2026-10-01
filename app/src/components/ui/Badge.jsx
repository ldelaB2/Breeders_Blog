import { cn } from "@/lib/utils/cn";

const TONES = {
  neutral: "bg-gray-100 text-gray-500",
  warning: "bg-amber-50 text-amber-600",
};

// Small rounded label: a post's topic, "Pending", "Locked".
function Badge({ tone = "neutral", className, children }) {
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", TONES[tone], className)}>
      {children}
    </span>
  );
}

export default Badge;
