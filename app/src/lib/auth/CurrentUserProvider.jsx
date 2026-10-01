import { useAuth } from "@clerk/react";
import { CurrentUserContext } from "./currentUser";
import { useApi } from "@/lib/api/useApi";
import { useAsync } from "@/lib/hooks/useAsync";

// Fetches the signed-in user's own role once per session (see GET /api/me) -
// this is the only place the frontend learns whether it's talking to an
// admin, e.g. to decide whether to show the Admin nav link.
export function CurrentUserProvider({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const { data: me, loading } = useAsync(() => api.fetchCurrentUser(), [api, isSignedIn], {
    enabled: isLoaded && isSignedIn,
  });

  // A failed /me leaves `me` null, i.e. treated as a regular reader.
  const role = me?.role ?? null;
  const isAdmin = role === "ADMIN";
  const isModerator = role === "MODERATOR" || isAdmin;

  const value = {
    isAdmin,
    isModerator,
    // Role checks for route/nav entries tagged with `role` (config/routes.jsx).
    hasRole: (required) => (required === "ADMIN" ? isAdmin : isModerator),
    loading: !isLoaded || loading,
  };

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}
