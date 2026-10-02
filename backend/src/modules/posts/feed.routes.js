import { Router } from "express";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { optionalString, parseLimit } from "../../lib/http/validate.js";
import { SEARCH_WORDS_MAX, TOP_POSTS_LIMIT } from "../../config/limits.js";
import { isModerator } from "../users/roles.js";
import { listPosts } from "./posts.repo.js";
import { rankPosts } from "./ranking.js";
import { serializePosts } from "./serializePost.js";

// The post lists: the topic feed, the home page's top posts, and search.
export function feedRoutes({ auth }) {
  const router = Router();

  // Approved posts, plus the caller's own pending posts, plus (for a
  // moderator/admin) everyone's pending posts. Optional topicSlug filter.
  router.get(
    "/",
    auth.optionalAuth,
    asyncHandler(async (req, res) => {
      const topicSlug = optionalString(req.query.topicSlug, "topicSlug");
      const posts = await listPosts(
        {
          ...(topicSlug && { topicSlug }),
          OR: [
            { status: "APPROVED" },
            ...(req.user ? [{ authorId: req.user.id, status: "PENDING" }] : []),
            ...(isModerator(req.user?.role) ? [{ status: "PENDING" }] : []),
          ],
        },
        { createdAt: "desc" },
      );
      res.json(serializePosts(posts, req.user));
    }),
  );

  // Home page carousel: top posts site-wide by engagement.
  router.get(
    "/top",
    auth.optionalAuth,
    asyncHandler(async (req, res) => {
      const limit = parseLimit(req.query.limit, TOP_POSTS_LIMIT);
      const posts = await listPosts({ status: "APPROVED" });
      res.json(rankPosts(posts, req.user).slice(0, limit));
    }),
  );

  // Header search: approved posts whose title or abstract contains every
  // word of the query (case-insensitive). Never looks at the HTML body.
  router.get(
    "/search",
    auth.optionalAuth,
    asyncHandler(async (req, res) => {
      const q = (optionalString(req.query.q, "q") ?? "").trim();
      if (!q) return res.json([]);

      const words = q.split(/\s+/).slice(0, SEARCH_WORDS_MAX);
      const posts = await listPosts(
        {
          status: "APPROVED",
          AND: words.map((word) => ({
            OR: [
              { title: { contains: word, mode: "insensitive" } },
              { abstract: { contains: word, mode: "insensitive" } },
            ],
          })),
        },
        { createdAt: "desc" },
      );
      res.json(serializePosts(posts, req.user));
    }),
  );

  return router;
}
