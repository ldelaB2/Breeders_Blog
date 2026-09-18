import { verifyToken, createClerkClient } from "@clerk/backend";
import { prisma } from "../lib/prisma.js";
import { upsertUser } from "../lib/users.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Looks up the local User row for an already-verified Clerk user id. The
// row is trusted once it exists - the Clerk webhook (routes/webhooks.routes.js)
// keeps name/role/avatar/email in sync - so only a brand new user whose
// webhook hasn't landed yet costs a live Clerk API call.
async function resolveUser(userId) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const u = await clerkClient.users.getUser(userId);
  return upsertUser({
    id: userId,
    name: u.fullName || u.username,
    role: u.privateMetadata?.role,
    avatarUrl: u.imageUrl,
    email: u.primaryEmailAddress?.emailAddress,
  });
}

async function authenticate(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const { sub } = await verifyToken(header.slice(7), { secretKey: process.env.CLERK_SECRET_KEY });
  return sub;
}

function attachUser(req, user) {
  req.userId = user.id;
  req.userName = user.name;
  req.userRole = user.role;
  req.userAvatarUrl = user.avatarUrl;
}

// Requires a valid Clerk session. Attaches req.userId/userName/userRole/
// userAvatarUrl. Only a token that fails Clerk's check is a 401 - a DB
// failure resolving the user is a real 500, not proof the session is bad.
export async function requireAuth(req, res, next) {
  let userId;
  try {
    userId = await authenticate(req);
  } catch {
    return res.status(401).json({ error: "Invalid auth token" });
  }
  if (!userId) return res.status(401).json({ error: "Missing auth token" });

  try {
    attachUser(req, await resolveUser(userId));
    next();
  } catch (err) {
    next(err);
  }
}

// Same, but never blocks: for routes that behave differently for signed-in
// vs anonymous callers (e.g. seeing your own pending post in the feed). An
// invalid token just proceeds as anonymous.
export async function optionalAuth(req, res, next) {
  try {
    const userId = await authenticate(req);
    if (userId) attachUser(req, await resolveUser(userId));
  } catch {
    // proceed as anonymous
  }
  next();
}

// Must run after requireAuth. 403s unless req.userRole is one of `roles`.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
