import { Router } from "express";
import { Webhook } from "svix";
import { asyncHandler } from "../lib/asyncHandler.js";
import { upsertUser } from "../lib/users.js";

const router = Router();

// Clerk calls this on user.created (so a new sign-up gets a local User row
// immediately) and user.updated (so a name/role/avatar change - e.g. an
// admin promoting someone in the Clerk dashboard - propagates without that
// user having to make a request first). Mounted with express.raw() in
// app.js: svix verifies the exact bytes Clerk sent, so this must run before
// the global express.json() parser.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    let event;
    try {
      event = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET).verify(req.body, {
        "svix-id": req.headers["svix-id"],
        "svix-timestamp": req.headers["svix-timestamp"],
        "svix-signature": req.headers["svix-signature"],
      });
    } catch {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    if (event.type === "user.created" || event.type === "user.updated") {
      const u = event.data;
      await upsertUser({
        id: u.id,
        name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username,
        role: u.private_metadata?.role,
        avatarUrl: u.image_url,
        email: u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address,
      });
    }

    res.status(200).json({ received: true });
  })
);

export default router;
