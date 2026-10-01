import { prisma } from "../lib/prisma.js";
import { upsertUser } from "../lib/users.js";

// Looks up the local User row for an already-verified Clerk user id. The
// row is trusted once it exists - the Clerk webhook (routes/webhooks.routes.js)
// keeps name/role/avatar/email in sync - so only a brand new user whose
// webhook hasn't landed yet costs a live Clerk API call.
async function resolveUser(clerk, userId) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const u = await clerk.fetchUser(userId);
  return upsertUser({
    id: userId,
    name: u.fullName || u.username,
    role: u.privateMetadata?.role,
    avatarUrl: u.imageUrl,
    email: u.primaryEmailAddress?.emailAddress,
  });
}

async function authenticate(clerk, req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return clerk.verifySession(header.slice(7));
}

function attachUser(req, user) {
  req.userId = user.id;
  req.userName = user.name;
  req.userRole = user.role;
  req.userAvatarUrl = user.avatarUrl;
}

export function createAuthMiddleware(clerk) {
  // Requires a valid Clerk session. Attaches req.userId/userName/userRole/
  // userAvatarUrl. Only a token that fails Clerk's check is a 401 - a DB
  // failure resolving the user is a real 500, not proof the session is bad.
  async function requireAuth(req, res, next) {
    let userId;
    try {
      userId = await authenticate(clerk, req);
    } catch {
      return res.status(401).json({ error: "Invalid auth token" });
    }
    if (!userId) return res.status(401).json({ error: "Missing auth token" });

    try {
      attachUser(req, await resolveUser(clerk, userId));
      next();
    } catch (err) {
      next(err);
    }
  }

  // Same, but never blocks: for routes that behave differently for signed-in
  // vs anonymous callers (e.g. seeing your own pending post in the feed). An
  // invalid token just proceeds as anonymous.
  async function optionalAuth(req, res, next) {
    try {
      const userId = await authenticate(clerk, req);
      if (userId) attachUser(req, await resolveUser(clerk, userId));
    } catch {
      // proceed as anonymous
    }
    next();
  }

  return { requireAuth, optionalAuth };
}

// Must run after requireAuth. 403s unless req.userRole is one of `roles`.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
