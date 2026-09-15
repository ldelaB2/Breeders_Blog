import { useCurrentUser } from "../lib/useCurrentUser";

// Route-level guard: children only mount once the signed-in user's role is
// confirmed. Keeps access control at the routing layer so any future
// admin/mod page inherits it automatically instead of relying on each page
// to replicate its own isAdmin/loading check. The backend independently
// re-enforces this on every endpoint - this is UX, not the boundary.
export default function RequireRole({ role, children }) {
  const { isAdmin, isModerator, loading } = useCurrentUser();
  const authorized = role === "ADMIN" ? isAdmin : isModerator;

  if (loading) return <p className="p-8 text-gray-500">Loading…</p>;
  if (!authorized) return <p className="p-8 text-gray-500">You don't have access to this page.</p>;
  return children;
}
