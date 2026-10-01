import { cn } from "@/lib/utils/cn";

const TONES = {
  error: "text-sm text-red-600",
  muted: "text-gray-500", // loading / empty states
};

// A status line: errors, "Loading…", "No posts yet.".
function Message({ tone = "muted", className, children }) {
  return <p className={cn(TONES[tone], className)}>{children}</p>;
}

export default Message;
