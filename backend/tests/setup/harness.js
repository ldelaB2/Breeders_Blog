import { after, beforeEach } from "node:test";
import { assertLocalDatabase } from "./guard.js";
import { createFakes } from "./fakes.js";
import { MODELS } from "../../src/lib/db/models.js";

assertLocalDatabase();

// Storage is faked, but share-image URLs are built from these (imageUrlFor
// in src/modules/posts/posts.repo.js), so give them fixed test values.
process.env.SUPABASE_URL = "https://storage.test";
process.env.SUPABASE_IMAGE_BUCKET = "post-image";

const { createApp } = await import("../../src/app.js");
const { prisma } = await import("../../src/lib/db/prisma.js");

export { prisma };

// Every table in the schema (see lib/db/models.js), emptied before each test.
const TABLES = MODELS.map((m) => `"${m.table}"`).join(", ");

// Call once at the top of a test file. Before each test the database is
// emptied and `ctx` gets a fresh app wired to fresh fakes:
//   ctx.app                    the Express app, for supertest
//   ctx.clerk/stores/mailer    the fakes, to arrange or inspect
export function useTestApp() {
  const ctx = {};

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES} CASCADE`);
    const fakes = createFakes();
    Object.assign(ctx, fakes, { app: createApp(fakes.deps) });
  });

  after(() => prisma.$disconnect());

  return ctx;
}

// Authorization header for a request made as `userId` (see the fake clerk).
export const as = (userId) => ({ Authorization: `Bearer test:${userId}` });
