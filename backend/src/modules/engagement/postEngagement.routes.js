import { Router } from "express";
import { prisma } from "../../lib/db/prisma.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { findPost, loadPostParam } from "../posts/posts.repo.js";
import { requireApproved } from "../posts/postStatus.js";
import { serializePost } from "../posts/serializePost.js";
import { toggleMembership } from "./toggles.js";
import { voteRoutes } from "./voteRoutes.js";

// Votes and pins on a post. Both only apply to approved posts and respond
// with the freshly re-read post.
export function postEngagementRoutes({ auth }) {
  const router = Router();
  loadPostParam(router);

  const guards = [auth.requireAuth, requireApproved];
  const keyFor = (req) => ({ postId_userId: { postId: req.post.id, userId: req.user.id } });
  const respond = async (req) => serializePost(await findPost(req.post.id), req.user);

  voteRoutes(router, { guards, model: prisma.vote, keyFor, respond });

  router.post(
    "/:id/pin",
    ...guards,
    asyncHandler(async (req, res) => {
      await toggleMembership(prisma.pin, keyFor(req));
      res.json(await respond(req));
    }),
  );

  return router;
}
