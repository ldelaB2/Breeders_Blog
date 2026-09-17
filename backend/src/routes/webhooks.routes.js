import { Router } from "express";
import { Webhook } from "svix";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const router = Router();

const VALID_ROLES = ["USER", "MODERATOR", "ADMIN"];

// Shared by both user.created and user.updated - keeps the local User row's
// name/role/avatarUrl in sync with Clerk so requireAuth (middleware/
// requireAuth.js) can trust the DB and skip a live Clerk API call on every
// single authenticated request.
async function syncUserFromWebhook(user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Anonymous";
  const metadataRole = user.private_metadata?.role;
  const role = VALID_ROLES.includes(metadataRole) ? metadataRole : "USER";
  const avatarUrl = user.image_url;
  const email =
    user.email_addresses?.find((e) => e.id === user.primary_email_address_id)?.email_address ?? null;

  await prisma.user.upsert({
    where: { id: user.id },
    update: { name, role, avatarUrl, email },
    create: { id: user.id, name, role, avatarUrl, email },
  });
}

// Clerk calls this on user.created so a new sign-up gets a local User row
// immediately, instead of waiting for their first authenticated request
// (see resolveUser in middleware/requireAuth.js, which does that lazily),
// and on user.updated so a later name/role/avatar change (e.g. an admin
// promoting someone via the Clerk dashboard) propagates without needing
// that user to make a request first. Mounted with express.raw() in app.js -
// svix verifies the exact raw bytes Clerk sent, so this must run before the
// global express.json() parser.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    let event;
    try {
      const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET);
      event = wh.verify(req.body, {
        "svix-id": req.headers["svix-id"],
        "svix-timestamp": req.headers["svix-timestamp"],
        "svix-signature": req.headers["svix-signature"],
      });
    } catch {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    if (event.type === "user.created" || event.type === "user.updated") {
      await syncUserFromWebhook(event.data);
    }

    res.status(200).json({ received: true });
  })
);

export default router;
