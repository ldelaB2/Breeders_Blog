import { verifyToken, createClerkClient } from "@clerk/backend";
import { prisma } from "../lib/prisma.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Verifies a Clerk session token and lazily syncs the user into our
// database, returning the local User row (id/name/role).
async function resolveUser(token) {
  const { sub: userId } = await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const clerkUser = await clerkClient.users.getUser(userId);
    const name = clerkUser.fullName || clerkUser.username || "Anonymous";
    user = await prisma.user.create({ data: { id: userId, name } });
  }
  return user;
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// Requires a valid Clerk session. Attaches req.userId/userName/userRole.
export async function requireAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  try {
    const user = await resolveUser(token);
    req.userId = user.id;
    req.userName = user.name;
    req.userRole = user.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid auth token" });
  }
}

// Attaches req.userId/userName/userRole when a valid session is present,
// but never blocks the request - for routes that behave differently for
// signed-in vs anonymous callers (e.g. previewing your own pending post).
export async function optionalAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) return next();

  try {
    const user = await resolveUser(token);
    req.userId = user.id;
    req.userName = user.name;
    req.userRole = user.role;
  } catch {
    // Invalid/expired token on an optional route: proceed as anonymous.
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
