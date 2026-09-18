import { useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { CurrentUserContext } from "./currentUserContext";
import { useApi } from "./api";

// Fetches the signed-in user's own role once per session (see GET /api/me) -
// this is the only place the frontend learns whether it's talking to an
// admin, e.g. to decide whether to show the Admin nav link.
export function CurrentUserProvider({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .fetchCurrentUser()
      .then((me) => setRole(me.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const value = {
    isAdmin: role === "ADMIN",
    isModerator: role === "MODERATOR" || role === "ADMIN",
    loading,
  };

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}
