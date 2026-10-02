import { Router } from "express";
import { prisma } from "../../lib/db/prisma.js";
import { ignoreConflicts } from "../../lib/db/prismaErrors.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { HttpError } from "../../lib/http/httpError.js";
import { requireText } from "../../lib/http/validate.js";
import { ID_MAX } from "../../config/limits.js";
import { ownsOrModerates } from "../users/roles.js";
import { loadPostParam, postInclude } from "../posts/posts.repo.js";
import { serializePosts } from "../posts/serializePost.js";

// Linked posts are directional and shown on the source post only: linking
// A -> B never surfaces A under B. Only the post's own author or a
// moderator/admin may curate them.
export function linksRoutes({ auth }) {
  const router = Router();
  loadPostParam(router);

  const assertCanManage = (req) => {
    if (!ownsOrModerates(req.user, req.post.authorId)) throw new HttpError(403, "Forbidden");
  };

  router.get(
    "/:id/links",
    auth.optionalAuth,
    asyncHandler(async (req, res) => {
      const links = await prisma.postLink.findMany({
        where: { sourcePostId: req.post.id, targetPost: { status: "APPROVED" } },
        include: { targetPost: { include: postInclude } },
        orderBy: { createdAt: "asc" },
      });
      res.json(serializePosts(links.map((l) => l.targetPost), req.user));
    }),
  );

  router.post(
    "/:id/links",
    auth.requireAuth,
    asyncHandler(async (req, res) => {
      assertCanManage(req);
      const targetPostId = requireText(req.body.targetPostId, "targetPostId", ID_MAX);
      if (targetPostId === req.post.id) throw new HttpError(400, "A post can't be linked to itself");

      const target = await prisma.postMetadata.findUnique({
        where: { id: targetPostId },
        select: { id: true, status: true },
      });
      if (!target || target.status !== "APPROVED") throw new HttpError(400, "Target post not found");

      // Already linked is fine - the request's end state holds either way.
      await ignoreConflicts(prisma.postLink.create({ data: { sourcePostId: req.post.id, targetPostId } }), ["P2002"]);
      res.status(204).end();
    }),
  );

  router.delete(
    "/:id/links/:targetId",
    auth.requireAuth,
    asyncHandler(async (req, res) => {
      assertCanManage(req);
      const key = { sourcePostId: req.post.id, targetPostId: req.params.targetId };
      await ignoreConflicts(prisma.postLink.delete({ where: { sourcePostId_targetPostId: key } }), ["P2025"]);
      res.status(204).end();
    }),
  );

  return router;
}
