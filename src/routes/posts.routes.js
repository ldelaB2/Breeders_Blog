import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth, requireRole } from "../middleware/requireAuth.js";
import { serializePost } from "../lib/serializePost.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getStitchedHtml } from "../lib/htmlStore.js";

const router = Router();
const include = {
  votes: true,
  pins: true,
  body: true,
  _count: { select: { comments: { where: { deletedAt: null } } } },
};

async function findPost(id) {
  return prisma.postMetadata.findUnique({ where: { id }, include });
}

async function toggleVote(postId, userId, value) {
  const existing = await prisma.vote.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing?.value === value) {
    await prisma.vote.delete({ where: { postId_userId: { postId, userId } } });
  } else if (existing) {
    await prisma.vote.update({
      where: { postId_userId: { postId, userId } },
      data: { value },
    });
  } else {
    await prisma.vote.create({ data: { postId, userId, value } });
  }
}

function canView(post, viewer) {
  if (post.status === "APPROVED") return true;
  const isModerator = viewer.userRole === "MODERATOR" || viewer.userRole === "ADMIN";
  return isModerator || viewer.userId === post.authorId;
}

// Post-body fields arrive as JSON, so a caller can send an object/array in
// place of a string (e.g. {"title": ["x"]}); requiring a plain string here
// stops that reaching a raw `.trim()` call or a Prisma write.
function requireString(value, field, res) {
  if (typeof value !== "string" || !value.trim()) {
    res.status(400).json({ error: `${field} is required` });
    return null;
  }
  return value.trim();
}

// Feed: approved posts, plus (for a signed-in caller) their own pending
// posts, plus (for a moderator/admin) everyone's pending posts - so a
// pending post is visible only to its author and a moderator/admin, per
// canView's rule for the single-post route. Optional topicSlug filter.
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { topicSlug } = req.query;
    // req.query values can be nested objects (e.g. ?topicSlug[not]=), which
    // Express's default "extended" query parser would otherwise pass straight
    // through into a Prisma filter as an operator (topicSlug: { not: "" } is
    // a valid Prisma StringFilter) - so only ever treat it as a plain string.
    if (topicSlug !== undefined && typeof topicSlug !== "string") {
      return res.status(400).json({ error: "topicSlug must be a string" });
    }
    const isModerator = req.userRole === "MODERATOR" || req.userRole === "ADMIN";
    const posts = await prisma.postMetadata.findMany({
      where: {
        ...(topicSlug && { topicSlug }),
        OR: [
          { status: "APPROVED" },
          ...(req.userId ? [{ authorId: req.userId, status: "PENDING" }] : []),
          ...(isModerator ? [{ status: "PENDING" }] : []),
        ],
      },
      include,
      orderBy: { createdAt: "desc" },
    });
    res.json(posts.map((p) => serializePost(p, { userId: req.userId, userRole: req.userRole })));
  })
);

// Moderation queue. Must come before "/:id" so it isn't captured by it.
router.get(
  "/pending",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const posts = await prisma.postMetadata.findMany({
      where: { status: "PENDING" },
      include,
      orderBy: { createdAt: "asc" },
    });
    res.json(posts.map((p) => serializePost(p, { userRole: req.userRole })));
  })
);

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const post = await findPost(req.params.id);
    if (!post || !canView(post, req)) return res.status(404).json({ error: "Post not found" });
    // Fetched once here (not on the list endpoint) so the feed/list view
    // never pulls full post HTML off S3 for every card.
    const html = await getStitchedHtml(post.body?.htmlSlug);
    res.json(serializePost(post, { userId: req.userId, userRole: req.userRole }, { html }));
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const topicSlug = requireString(req.body.topicSlug, "topicSlug", res);
    if (!topicSlug) return;
    const title = requireString(req.body.title, "title", res);
    if (!title) return;
    const abstract = requireString(req.body.abstract, "abstract", res);
    if (!abstract) return;
    const rawMd = typeof req.body.rawMd === "string" ? req.body.rawMd.trim() : "";

    const post = await prisma.postMetadata.create({
      data: {
        topicSlug,
        title,
        abstract,
        authorId: req.userId,
        authorName: req.userName,
        body: { create: { rawMd } },
      },
      include,
    });
    res.status(201).json(serializePost(post, { userId: req.userId, userRole: req.userRole }));
  })
);

// Approve a pending post: the reviewer supplies the S3 key/slug of the
// HTML they stitched together from the raw markdown.
router.post(
  "/:id/approve",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const htmlSlug = requireString(req.body.htmlSlug, "htmlSlug", res);
    if (!htmlSlug) return;

    const post = await findPost(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending posts can be approved" });
    }

    const updated = await prisma.postMetadata.update({
      where: { id: req.params.id },
      data: {
        status: "APPROVED",
        reviewedById: req.userId,
        reviewedAt: new Date(),
        body: { update: { htmlSlug, htmlUpdatedAt: new Date() } },
      },
      include,
    });
    res.json(serializePost(updated, { userId: req.userId, userRole: req.userRole }));
  })
);

router.post(
  "/:id/reject",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const rejectionReason = requireString(req.body.rejectionReason, "rejectionReason", res);
    if (!rejectionReason) return;

    const post = await findPost(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending posts can be rejected" });
    }

    const updated = await prisma.postMetadata.update({
      where: { id: req.params.id },
      data: {
        status: "REJECTED",
        reviewedById: req.userId,
        reviewedAt: new Date(),
        rejectionReason,
      },
      include,
    });
    res.json(serializePost(updated, { userId: req.userId, userRole: req.userRole }));
  })
);

router.post(
  "/:id/upvote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await findPost(req.params.id);
    if (!post || post.status !== "APPROVED") return res.status(404).json({ error: "Post not found" });
    await toggleVote(req.params.id, req.userId, 1);
    res.json(serializePost(await findPost(req.params.id), { userId: req.userId, userRole: req.userRole }));
  })
);

router.post(
  "/:id/downvote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await findPost(req.params.id);
    if (!post || post.status !== "APPROVED") return res.status(404).json({ error: "Post not found" });
    await toggleVote(req.params.id, req.userId, -1);
    res.json(serializePost(await findPost(req.params.id), { userId: req.userId, userRole: req.userRole }));
  })
);

router.post(
  "/:id/pin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const post = await findPost(postId);
    if (!post || post.status !== "APPROVED") return res.status(404).json({ error: "Post not found" });

    const where = { postId_userId: { postId, userId: req.userId } };
    const existing = await prisma.pin.findUnique({ where });
    if (existing) {
      await prisma.pin.delete({ where });
    } else {
      await prisma.pin.create({ data: { postId, userId: req.userId } });
    }
    res.json(serializePost(await findPost(postId), { userId: req.userId, userRole: req.userRole }));
  })
);

export default router;
