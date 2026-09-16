import { Router } from "express";
import { Webhook } from "svix";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const router = Router();

const VALID_ROLES = ["USER", "MODERATOR", "ADMIN"];

// Clerk calls this on user.created so a new sign-up gets a local User row
// immediately, instead of waiting for their first authenticated request
// (see resolveUser in middleware/requireAuth.js, which does that lazily).
// Mounted with express.raw() in app.js - svix verifies the exact raw bytes
// Clerk sent, so this must run before the global express.json() parser.
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

    if (event.type === "user.created") {
      const user = event.data;
      const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Anonymous";
      const metadataRole = user.private_metadata?.role;
      const role = VALID_ROLES.includes(metadataRole) ? metadataRole : "USER";

      await prisma.user.upsert({
        where: { id: user.id },
        update: { name, role },
        create: { id: user.id, name, role },
      });
    }

    res.status(200).json({ received: true });
  })
);

export default router;
