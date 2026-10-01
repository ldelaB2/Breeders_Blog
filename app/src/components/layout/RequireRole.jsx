import Message from "@/components/ui/Message";
import { useCurrentUser } from "@/lib/auth/currentUser";

// Route-level guard: children only mount once the signed-in user's role is
// confirmed. App.jsx applies it to every route tagged with `role` in
// config/routes.jsx, so any future admin/mod page inherits it automatically
// instead of each page replicating its own isAdmin/loading check. The
// backend independently re-enforces this on every endpoint - this is UX,
// not the boundary.
export default function RequireRole({ role, children }) {
  const { hasRole, loading } = useCurrentUser();

  if (loading) return <Message className="p-8">Loading…</Message>;
  if (!hasRole(role)) return <Message className="p-8">You don't have access to this page.</Message>;
  return children;
}
