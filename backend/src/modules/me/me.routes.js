import { Router } from "express";
import { prisma } from "../../lib/db/prisma.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { parseLimit } from "../../lib/http/validate.js";
import { RECOMMENDATIONS_LIMIT } from "../../config/limits.js";
import { postInclude } from "../posts/posts.repo.js";
import { serializePosts } from "../posts/serializePost.js";
import { getRecommendedPosts } from "./recommendations.js";

// The signed-in caller's own data (mounted at /api).
export function meRoutes({ auth }) {
  const router = Router();

  // The only way the frontend learns a signed-in user's own role (e.g. to
  // decide whether to show the Admin nav link) - role otherwise never
  // appears in any other API response.
  router.get("/me", auth.requireAuth, (req, res) => {
    res.json({ id: req.user.id, name: req.user.name, role: req.user.role });
  });

  // Home page "Your Pinned Posts": every post the caller has pinned, across
  // every topic, most recently pinned first.
  router.get(
    "/me/pins",
    auth.requireAuth,
    asyncHandler(async (req, res) => {
      const pins = await prisma.pin.findMany({
        where: { userId: req.user.id },
        include: { post: { include: postInclude } },
        orderBy: { createdAt: "desc" },
      });
      res.json(serializePosts(pins.map((pin) => pin.post), req.user));
    }),
  );

  // Home page "Recommended for You". Scoring logic lives in recommendations.js.
  router.get(
    "/me/recommendations",
    auth.requireAuth,
    asyncHandler(async (req, res) => {
      const limit = parseLimit(req.query.limit, RECOMMENDATIONS_LIMIT);
      res.json(await getRecommendedPosts({ user: req.user, limit }));
    }),
  );

  return router;
}
