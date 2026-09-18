import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { serializeComment } from "../lib/serializeComment.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError, requireText } from "../lib/httpError.js";
import { isModerator } from "../lib/roles.js";
import { toggleVote } from "../lib/toggleVote.js";

const COMMENT_MAX = 5000;

const router = Router();
const include = { votes: true };
const findComment = (id) => prisma.comment.findUnique({ where: { id }, include });

// Every "/comments/:id" route below gets the comment loaded as req.comment, or a 404.
router.param(
  "id",
  asyncHandler(async (req, res, next, id) => {
    req.comment = await findComment(id);
    if (!req.comment) throw new HttpError(404, "Comment not found");
    next();
  })
);

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
  })
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
      data: { postId, parentId: parentId || null, authorId: req.userId, authorName: req.userName, text },
      include,
    });
    res.status(201).json(serializeComment(comment));
  })
);

// Soft-delete by the author or a moderator/admin. The text stays in the
// row (serializeComment hides it) so a restore brings it straight back.
router.delete(
  "/comments/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.comment.authorId !== req.userId && !isModerator(req.userRole)) throw new HttpError(403, "Forbidden");
    const updated = await prisma.comment.update({ where: { id: req.comment.id }, data: { deletedAt: new Date() }, include });
    res.json(serializeComment(updated));
  })
);

// Moderator/admin only - unlike deleting, restoring is never left to the author.
router.post(
  "/comments/:id/restore",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    if (!req.comment.deletedAt) throw new HttpError(400, "Comment is not deleted");
    const updated = await prisma.comment.update({ where: { id: req.comment.id }, data: { deletedAt: null }, include });
    res.json(serializeComment(updated));
  })
);

async function vote(req, res, value) {
  const where = { commentId_userId: { commentId: req.comment.id, userId: req.userId } };
  await toggleVote(prisma.commentVote, where, where.commentId_userId, value);
  res.json(serializeComment(await findComment(req.comment.id)));
}

router.post("/comments/:id/upvote", requireAuth, asyncHandler((req, res) => vote(req, res, 1)));
router.post("/comments/:id/downvote", requireAuth, asyncHandler((req, res) => vote(req, res, -1)));

export default router;
