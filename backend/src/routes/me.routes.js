import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { serializePost } from "../lib/serializePost.js";
import { postInclude as include } from "../lib/postInclude.js";
import { getRecommendedPosts } from "../lib/recommendations.js";

const router = Router();

// The only way the frontend learns a signed-in user's own role (e.g. to
// decide whether to show the Admin nav link) - role otherwise never
// appears in any other API response.
router.get("/me", requireAuth, (req, res) => {
  res.json({ id: req.userId, name: req.userName, role: req.userRole });
});

// Home page "Your Pinned Posts": every post the caller has pinned, across
// every topic, most recently pinned first.
router.get(
  "/me/pins",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pins = await prisma.pin.findMany({
      where: { userId: req.userId },
      include: { post: { include } },
      orderBy: { createdAt: "desc" },
    });
    res.json(pins.map((pin) => serializePost(pin.post, { userId: req.userId, userRole: req.userRole })));
  })
);

// Home page "Recommended for You". Scoring logic lives in lib/recommendations.js.
router.get(
  "/me/recommendations",
  requireAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const posts = await getRecommendedPosts({ userId: req.userId, userRole: req.userRole, limit });
    res.json(posts);
  })
);

export default router;
