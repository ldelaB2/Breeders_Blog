import { verifyToken, createClerkClient } from "@clerk/backend";
import { prisma } from "../lib/prisma.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const VALID_ROLES = ["USER", "MODERATOR", "ADMIN"];

// Verifies a Clerk session token and lazily syncs the user into our
// database, returning the local User row (id/name/role).
//
// Role is assigned in the Clerk dashboard via privateMetadata.role (never
// publicMetadata/unsafeMetadata - unsafeMetadata is end-user writable, which
// would let a user grant themselves MODERATOR/ADMIN). privateMetadata is
// backend-only, so it never reaches the client.
async function resolveUser(token) {
  const { sub: userId } = await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  const clerkUser = await clerkClient.users.getUser(userId);
  const name = clerkUser.fullName || clerkUser.username || "Anonymous";
  const metadataRole = clerkUser.privateMetadata?.role;
  const role = VALID_ROLES.includes(metadataRole) ? metadataRole : "USER";

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: { name, role },
    create: { id: userId, name, role },
  });
  return { ...user, avatarUrl: clerkUser.imageUrl };
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
    req.userAvatarUrl = user.avatarUrl;
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
    req.userAvatarUrl = user.avatarUrl;
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
