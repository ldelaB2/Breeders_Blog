import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { postsRouter } from "./modules/posts/index.js";
import { commentsRoutes } from "./modules/comments/comments.routes.js";
import { meRoutes } from "./modules/me/me.routes.js";
import { sitemapRoutes } from "./modules/sitemap/sitemap.routes.js";
import { clerkWebhookRoutes } from "./modules/webhooks/clerk.routes.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { env } from "./config/env.js";
import { createNotifications } from "./modules/moderation/notifications.js";
import { defaultDeps } from "./deps.js";

// Builds the Express app around its external services (see deps.js). The
// deployed app uses the real ones; the test suite passes in fakes.
export function createApp(deps = defaultDeps()) {
  const app = express();
  app.set("trust proxy", 1);

  const ctx = {
    auth: createAuthMiddleware(deps.clerk),
    stores: deps.stores,
    notify: createNotifications(deps.mailer),
  };

  app.use(cors({ origin: env.corsOrigins }));

  // Needs the raw request body to verify Clerk's signature, so it's mounted
  // with express.raw() ahead of the JSON parser and the rate limiter.
  app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhookRoutes());

  // Bumped from Express's 100kb default for metadata payloads only - post
  // uploads and stitched HTML go straight to Supabase Storage via signed URLs
  // and never pass through here. Kept under Vercel's ~4.5mb request limit.
  app.use(express.json({ limit: "4mb" }));

  // Caps abuse per client IP and bounds the Clerk API calls requireAuth can
  // make. The counter is in-memory, so on Vercel it's per function instance -
  // a coarse backstop; Vercel's firewall is the real DDoS layer.
  app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/posts", postsRouter(ctx));
  app.use("/api", commentsRoutes(ctx));
  app.use("/api", meRoutes(ctx));
  app.use(sitemapRoutes());

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
