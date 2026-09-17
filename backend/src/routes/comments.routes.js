import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { serializeComment } from "../lib/serializeComment.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const router = Router();
const include = { votes: true };

async function findComment(id) {
  return prisma.comment.findUnique({ where: { id }, include });
}

async function toggleVote(commentId, userId, value) {
  const existing = await prisma.commentVote.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });
  try {
    if (existing?.value === value) {
      await prisma.commentVote.delete({ where: { commentId_userId: { commentId, userId } } });
    } else if (existing) {
      await prisma.commentVote.update({
        where: { commentId_userId: { commentId, userId } },
        data: { value },
      });
    } else {
      await prisma.commentVote.create({ data: { commentId, userId, value } });
    }
  } catch (err) {
    // See the identical comment in posts.routes.js's toggleVote - a
    // second, overlapping toggle for the same (commentId, userId) can race
    // this read-then-write and collide on the write. The loser can just
    // no-op instead of 500ing, since the response is built from a fresh
    // re-fetch either way.
    if (err.code !== "P2002" && err.code !== "P2025") throw err;
  }
}

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
    const { text, parentId } = req.body;
    // Body fields arrive as JSON and can be any type, not just a string -
    // reject anything else before it reaches .trim()/a Prisma write.
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }
    if (parentId !== undefined && parentId !== null && typeof parentId !== "string") {
      return res.status(400).json({ error: "parentId must be a string" });
    }

    const post = await prisma.postMetadata.findUnique({ where: { id: postId } });
    if (!post || post.status !== "APPROVED") {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.locked) {
      return res.status(403).json({ error: "Post is locked" });
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId) {
        return res.status(400).json({ error: "parentId must reference a comment on the same post" });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        parentId: parentId || null,
        authorId: req.userId,
        authorName: req.userName,
        text: text.trim(),
      },
      include,
    });
    res.status(201).json(serializeComment(comment));
  })
);

router.delete(
  "/comments/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const comment = await findComment(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const isModerator = req.userRole === "MODERATOR" || req.userRole === "ADMIN";
    if (comment.authorId !== req.userId && !isModerator) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
      include,
    });
    res.json(serializeComment(updated));
  })
);

// Undoes a soft-delete: the row's `text` was never cleared (see
// serializeComment.js), so clearing deletedAt is enough to bring the
// original comment straight back. Moderator/admin only - unlike deleting a
// comment, restoring one is never left to its own author.
router.post(
  "/comments/:id/restore",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const comment = await findComment(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (!comment.deletedAt) {
      return res.status(400).json({ error: "Comment is not deleted" });
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { deletedAt: null },
      include,
    });
    res.json(serializeComment(updated));
  })
);

router.post(
  "/comments/:id/upvote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const comment = await findComment(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    await toggleVote(req.params.id, req.userId, 1);
    res.json(serializeComment(await findComment(req.params.id)));
  })
);

router.post(
  "/comments/:id/downvote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const comment = await findComment(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    await toggleVote(req.params.id, req.userId, -1);
    res.json(serializeComment(await findComment(req.params.id)));
  })
);

export default router;
