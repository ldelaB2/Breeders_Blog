import { useContext } from "react";
import { CurrentUserContext } from "./currentUserContext";

export function useCurrentUser() {
  const value = useContext(CurrentUserContext);
  if (!value) throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  return value;
}
