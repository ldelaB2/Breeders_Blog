import { prisma } from "./prisma.js";
import { VALID_ROLES } from "./roles.js";

// Writes the local User row that mirrors a Clerk user. Role comes from
// Clerk's privateMetadata.role (set in the Clerk dashboard) - never
// publicMetadata/unsafeMetadata, which an end user can write themselves and
// would let them grant their own MODERATOR/ADMIN.
export function upsertUser({ id, name, role, avatarUrl, email }) {
  const data = {
    name: name || "Anonymous",
    role: VALID_ROLES.includes(role) ? role : "USER",
    avatarUrl,
    email: email ?? null,
  };
  return prisma.user.upsert({ where: { id }, update: data, create: { id, ...data } });
}
