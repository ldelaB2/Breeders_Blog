import { verifyToken, createClerkClient } from "@clerk/backend";
import { prisma } from "../lib/prisma.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const VALID_ROLES = ["USER", "MODERATOR", "ADMIN"];

// Looks up (or lazily creates) the local User row for an already-verified
// Clerk user id, returning (id/name/role/avatarUrl).
//
// Role is assigned in the Clerk dashboard via privateMetadata.role (never
// publicMetadata/unsafeMetadata - unsafeMetadata is end-user writable, which
// would let a user grant themselves MODERATOR/ADMIN). privateMetadata is
// backend-only, so it never reaches the client.
//
// Trusts the DB row once it exists rather than calling Clerk's API on every
// request: the webhook (routes/webhooks.routes.js) keeps name/role/avatarUrl
// in sync on user.created/user.updated, so a live Clerk lookup here would
// just be a slow, redundant re-fetch of data we already have. Only a brand
// new user - whose webhook hasn't landed yet - falls back to fetching and
// upserting from Clerk directly, same as this function always did.
async function resolveUser(userId) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(userId);
  const name = clerkUser.fullName || clerkUser.username || "Anonymous";
  const metadataRole = clerkUser.privateMetadata?.role;
  const role = VALID_ROLES.includes(metadataRole) ? metadataRole : "USER";
  const avatarUrl = clerkUser.imageUrl;
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;

  return prisma.user.upsert({
    where: { id: userId },
    update: { name, role, avatarUrl, email },
    create: { id: userId, name, role, avatarUrl, email },
  });
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// Requires a valid Clerk session. Attaches req.userId/userName/userRole.
//
// Token verification and the local DB lookup are kept in separate try/
// catches on purpose: only a token that actually fails Clerk's check should
// ever be reported as a 401 "Invalid auth token". A failure in the
// downstream DB lookup (e.g. a transient connection-pool timeout under
// load) is a real server error, not proof the caller's session is bad - it
// should surface as a 500 via the normal error handler instead of being
// misreported as an auth failure, which would be confusing for a valid,
// signed-in user hitting an unrelated backend hiccup.
export async function requireAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  let userId;
  try {
    ({ sub: userId } = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY }));
  } catch {
    return res.status(401).json({ error: "Invalid auth token" });
  }

  try {
    const user = await resolveUser(userId);
    req.userId = user.id;
    req.userName = user.name;
    req.userRole = user.role;
    req.userAvatarUrl = user.avatarUrl;
    next();
  } catch (err) {
    next(err);
  }
}

// Attaches req.userId/userName/userRole when a valid session is present,
// but never blocks the request - for routes that behave differently for
// signed-in vs anonymous callers (e.g. previewing your own pending post).
export async function optionalAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) return next();

  try {
    const { sub: userId } = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    const user = await resolveUser(userId);
    req.userId = user.id;
    req.userName = user.name;
    req.userRole = user.role;
    req.userAvatarUrl = user.avatarUrl;
  } catch {
    // Invalid/expired token, or a DB hiccup resolving the user - this route
    // never blocks on auth, so either way just proceed as anonymous.
  }
  next();
}

// Must run after requireAuth. 403s unless req.userRole is one of `roles`.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
