import { Router } from "express";
import { prisma } from "../../lib/db/prisma.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { HttpError } from "../../lib/http/httpError.js";
import { requireText } from "../../lib/http/validate.js";
import { COMMENT_MAX } from "../../config/limits.js";
import { loadResource } from "../../middleware/loadResource.js";
import { ownsOrModerates } from "../users/roles.js";
import { voteRoutes } from "../engagement/voteRoutes.js";
import { serializeComment } from "./serializeComment.js";

const include = { votes: true };
const findComment = (id) => prisma.comment.findUnique({ where: { id }, include });
const updateComment = (id, data) => prisma.comment.update({ where: { id }, data, include });

// A post's comment thread (mounted at /api): listing and adding comments
// under /posts/:postId/comments, and per-comment actions under /comments/:id.
export function commentsRoutes({ auth }) {
  const { requireAuth, requireModerator } = auth;
  const router = Router();
  loadResource(router, "id", { find: findComment, as: "comment", notFound: "Comment not found" });

  // Flat list; the frontend threads replies client-side via parentId.
  router.get(
    "/posts/:postId/comments",
    asyncHandler(async (req, res) => {
      const comments = await prisma.comment.findMany({
        where: { postId: req.params.postId },
        include,
        orderBy: { createdAt: "asc" },
      });
      res.json(comments.map(serializeComment));
    }),
  );

  router.post(
    "/posts/:postId/comments",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { postId } = req.params;
      const { parentId } = req.body;
      const text = requireText(req.body.text, "text", COMMENT_MAX);
      if (parentId != null && typeof parentId !== "string") throw new HttpError(400, "parentId must be a string");

      const post = await prisma.postMetadata.findUnique({ where: { id: postId } });
      if (!post || post.status !== "APPROVED") throw new HttpError(404, "Post not found");
      if (post.locked) throw new HttpError(403, "Post is locked");

      if (parentId) {
        const parent = await prisma.comment.findUnique({ where: { id: parentId } });
        if (!parent || parent.postId !== postId) {
          throw new HttpError(400, "parentId must reference a comment on the same post");
        }
      }

      const comment = await prisma.comment.create({
        data: { postId, parentId: parentId || null, authorId: req.user.id, authorName: req.user.name, text },
        include,
      });
      res.status(201).json(serializeComment(comment));
    }),
  );

  // Soft-delete by the author or a moderator/admin. The text stays in the
  // row (serializeComment hides it) so a restore brings it straight back.
  router.delete(
    "/comments/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      if (!ownsOrModerates(req.user, req.comment.authorId)) throw new HttpError(403, "Forbidden");
      res.json(serializeComment(await updateComment(req.comment.id, { deletedAt: new Date() })));
    }),
  );

  // Moderator/admin only - unlike deleting, restoring is never left to the author.
  router.post(
    "/comments/:id/restore",
    requireModerator,
    asyncHandler(async (req, res) => {
      if (!req.comment.deletedAt) throw new HttpError(400, "Comment is not deleted");
      res.json(serializeComment(await updateComment(req.comment.id, { deletedAt: null })));
    }),
  );

  voteRoutes(router, {
    path: "/comments/:id",
    guards: [requireAuth],
    model: prisma.commentVote,
    keyFor: (req) => ({ commentId_userId: { commentId: req.comment.id, userId: req.user.id } }),
    respond: async (req) => serializeComment(await findComment(req.comment.id)),
  });

  return router;
}
