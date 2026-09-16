// Re-syncs every local User row's name/role from Clerk right now, instead of
// waiting for each user's next authenticated request (see resolveUser in
// src/middleware/requireAuth.js, which does this lazily per-request).
// Skips ids Clerk doesn't recognize (e.g. seeded fake users from prisma/seed.js).
import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const VALID_ROLES = ["USER", "MODERATOR", "ADMIN"];

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true, avatarUrl: true } });
  let updated = 0;
  let skipped = 0;

  for (const local of users) {
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(local.id);
    } catch {
      skipped++;
      continue;
    }

    const name = clerkUser.fullName || clerkUser.username || "Anonymous";
    const metadataRole = clerkUser.privateMetadata?.role;
    const role = VALID_ROLES.includes(metadataRole) ? metadataRole : "USER";
    const avatarUrl = clerkUser.imageUrl;

    if (name !== local.name || role !== local.role || avatarUrl !== local.avatarUrl) {
      await prisma.user.update({ where: { id: local.id }, data: { name, role, avatarUrl } });
      console.log(`updated ${local.id}: "${local.name}"/${local.role} -> "${name}"/${role}`);
      updated++;
    }
  }

  console.log(`Done. ${updated} updated, ${skipped} skipped (not a Clerk user), ${users.length - updated - skipped} already up to date.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
