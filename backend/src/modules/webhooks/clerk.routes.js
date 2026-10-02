import { Router } from "express";
import { Webhook } from "svix";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { HttpError } from "../../lib/http/httpError.js";
import { env } from "../../config/env.js";
import { forgetUser, profileFromClerkWebhook, upsertUser } from "../users/users.js";

// Clerk calls this on user.created (so a new sign-up gets a local User row
// immediately), user.updated (so a name/role/avatar change - e.g. an
// admin promoting someone in the Clerk dashboard - propagates without that
// user having to make a request first) and user.deleted (so their email
// isn't kept, see forgetUser). Mounted with express.raw() in
// app.js: svix verifies the exact bytes Clerk sent, so this must run before
// the global express.json() parser.
export function clerkWebhookRoutes() {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      let event;
      try {
        event = new Webhook(env.clerkWebhookSecret).verify(req.body, {
          "svix-id": req.headers["svix-id"],
          "svix-timestamp": req.headers["svix-timestamp"],
          "svix-signature": req.headers["svix-signature"],
        });
      } catch {
        throw new HttpError(400, "Invalid webhook signature");
      }

      if (event.type === "user.created" || event.type === "user.updated") {
        await upsertUser(profileFromClerkWebhook(event.data));
      } else if (event.type === "user.deleted") {
        await forgetUser(event.data.id);
      }

      res.status(200).json({ received: true });
    }),
  );

  return router;
}
