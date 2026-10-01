import { prisma } from "../../lib/db/prisma.js";
import { ROLES } from "./roles.js";

// The local User row mirrors a Clerk user. Role comes from Clerk's
// privateMetadata.role (set in the Clerk dashboard) - never
// publicMetadata/unsafeMetadata, which an end user can write themselves and
// would let them grant their own MODERATOR/ADMIN.
export function upsertUser({ id, name, role, avatarUrl, email }) {
  const data = {
    name: name || "Anonymous",
    role: ROLES.includes(role) ? role : "USER",
    avatarUrl,
    email: email ?? null,
  };
  return prisma.user.upsert({ where: { id }, update: data, create: { id, ...data } });
}

// The same Clerk user arrives in two shapes: camelCase from the Clerk API
// (auth middleware, for a user whose webhook hasn't landed yet) and
// snake_case in webhook payloads. Both map to upsertUser()'s input.

export const profileFromClerkApi = (id, u) => ({
  id,
  name: u.fullName || u.username,
  role: u.privateMetadata?.role,
  avatarUrl: u.imageUrl,
  email: u.primaryEmailAddress?.emailAddress,
});

export const profileFromClerkWebhook = (u) => ({
  id: u.id,
  name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username,
  role: u.private_metadata?.role,
  avatarUrl: u.image_url,
  email: u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address,
});
