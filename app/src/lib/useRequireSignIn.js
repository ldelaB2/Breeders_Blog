import { useUser } from "@clerk/react";
import { useToast } from "./useToast";

// Returns requireSignIn(action): true when signed in, otherwise shows a
// "Please sign in to <action>" toast and returns false.
export function useRequireSignIn() {
  const { user } = useUser();
  const showToast = useToast();
  return (action) => {
    if (user) return true;
    showToast(`Please sign in to ${action}`);
    return false;
  };
}
