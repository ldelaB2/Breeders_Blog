import { Router } from "express";
import { feedRoutes } from "./feed.routes.js";
import { submitRoutes } from "./submit.routes.js";
import { readRoutes } from "./read.routes.js";
import { moderationRoutes } from "../moderation/moderation.routes.js";
import { postEngagementRoutes } from "../engagement/postEngagement.routes.js";
import { linksRoutes } from "../links/links.routes.js";

// Everything under /api/posts, from several feature modules. Order matters:
// routers with static paths ("/top", "/upload-url", "/pending") come before
// readRoutes' GET "/:id", which would otherwise read "pending" as a post id.
export function postsRouter(ctx) {
  const router = Router();
  router.use(feedRoutes(ctx)); //            GET  /  /top  /search
  router.use(submitRoutes(ctx)); //          POST /upload-url  /
  router.use(moderationRoutes(ctx)); //      GET /pending, /:id/approve|reject|download|lock|archive, DELETE /:id
  router.use(postEngagementRoutes(ctx)); //  POST /:id/upvote|downvote|pin
  router.use(linksRoutes(ctx)); //           /:id/links
  router.use(readRoutes(ctx)); //            GET  /:id
  return router;
}
