import { Show, SignInButton, SignUpButton } from "@clerk/react";
import Button from "@/components/ui/Button";

// Sign In / Sign Up, shown only while signed out. On desktop they sit in
// the top bar; on mobile they live at the bottom of the hamburger menu
// instead of the crowded top bar (which then only shows the search icon,
// plus the UserButton avatar when signed in). `onClick` lets the mobile
// menu close itself as the Clerk modal opens.
const VARIANTS = {
  desktop: {
    wrapper: "hidden items-center gap-4 sm:flex sm:gap-6",
    signIn: { variant: "plain", size: "lg" },
    signUp: { variant: "accent", size: "lg" },
  },
  mobile: {
    wrapper: "flex gap-3 border-t border-canvas-border px-6 py-4",
    signIn: { variant: "outline", size: "touch", className: "flex-1" },
    signUp: { variant: "accent", size: "touch", className: "flex-1" },
  },
};

function AuthButtons({ variant, onClick }) {
  const { wrapper, signIn, signUp } = VARIANTS[variant];

  return (
    <Show when="signed-out">
      <div className={wrapper}>
        <SignInButton mode="modal">
          <Button {...signIn} onClick={onClick}>
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button {...signUp} onClick={onClick}>
            Sign Up
          </Button>
        </SignUpButton>
      </div>
    </Show>
  );
}

export default AuthButtons;
