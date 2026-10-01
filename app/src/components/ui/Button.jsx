import { cn } from "@/lib/utils/cn";

const VARIANTS = {
  primary: "bg-gray-900 text-white hover:bg-gray-700", // form submits
  accent: "bg-accent text-white hover:bg-accent-dark", // brand calls to action (Sign Up)
  danger: "bg-red-600 text-white hover:bg-red-700", // irreversible actions
  ghost: "text-gray-500 hover:bg-gray-100", // Cancel
  plain: "text-black hover:bg-gray-200", // Sign In next to an accent button
  outline: "border border-gray-300 text-black hover:bg-gray-100",
};

const SIZES = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-1.5 text-sm",
  touch: "px-4 py-2.5 text-base", // full-width buttons in the mobile menu
  lg: "px-5 py-2.5 text-lg",
};

// The one text button. Anything else a <button> takes (onClick, disabled,
// type="submit", aria-*) passes straight through.
function Button({ variant = "primary", size = "md", type = "button", className, ...props }) {
  return (
    <button
      type={type}
      className={cn("rounded-md transition-colors disabled:opacity-50", VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
}

export default Button;
