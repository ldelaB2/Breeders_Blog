import { prisma } from "../lib/db/prisma.js";
import { HttpError } from "../lib/http/httpError.js";
import { hasRole } from "../modules/users/roles.js";
import { profileFromClerkApi, upsertUser } from "../modules/users/users.js";

// Auth middleware around the injected Clerk service (deps.clerk). Every
// variant attaches the caller as req.user = { id, name, role, avatarUrl } -
// the same object the serializers take as their `viewer`.
export function createAuthMiddleware(clerk) {
  // Looks up the local User row for an already-verified Clerk user id. The
  // row is trusted once it exists - the Clerk webhook keeps
  // name/role/avatar/email in sync - so only a brand new user whose webhook
  // hasn't landed yet costs a live Clerk API call.
  async function resolveUser(userId) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) return existing;
    return upsertUser(profileFromClerkApi(userId, await clerk.fetchUser(userId)));
  }

  async function sessionUserId(req) {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return null;
    return clerk.verifySession(header.slice(7));
  }

  const attach = (req, { id, name, role, avatarUrl }) => {
    req.user = { id, name, role, avatarUrl };
  };

  // Requires a valid Clerk session. Only a token that fails Clerk's check is
  // a 401 - a DB failure resolving the user is a real 500, not proof the
  // session is bad.
  async function requireAuth(req, res, next) {
    let userId;
    try {
      userId = await sessionUserId(req);
    } catch {
      return next(new HttpError(401, "Invalid auth token"));
    }
    if (!userId) return next(new HttpError(401, "Missing auth token"));

    try {
      attach(req, await resolveUser(userId));
      next();
    } catch (err) {
      next(err);
    }
  }

  // Never blocks: for routes that behave differently for signed-in vs
  // anonymous callers (e.g. seeing your own pending post in the feed). An
  // invalid token just proceeds as anonymous, with req.user undefined.
  async function optionalAuth(req, res, next) {
    try {
      const userId = await sessionUserId(req);
      if (userId) attach(req, await resolveUser(userId));
    } catch {
      // proceed as anonymous
    }
    next();
  }

  // Signed in with at least `minRole` (roles are hierarchical - see roles.js).
  const requireRole = (minRole) => [
    requireAuth,
    (req, res, next) => next(hasRole(req.user.role, minRole) ? undefined : new HttpError(403, "Forbidden")),
  ];

  return {
    requireAuth,
    optionalAuth,
    requireModerator: requireRole("MODERATOR"),
    requireAdmin: requireRole("ADMIN"),
  };
}
