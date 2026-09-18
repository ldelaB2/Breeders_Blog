import { Router } from "express";
import path from "node:path";
import crypto from "node:crypto";
import { ZipArchive } from "archiver";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth, requireRole } from "../middleware/requireAuth.js";
import { serializePost } from "../lib/serializePost.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError, requireText } from "../lib/httpError.js";
import { isModerator } from "../lib/roles.js";
import { TOPIC_SLUGS } from "../lib/topics.js";
import { toggleVote } from "../lib/toggleVote.js";
import { postInclude as include } from "../lib/postInclude.js";
import { rankScore } from "../lib/rankScore.js";
import { notifyAdminsOfPendingPost, notifyAuthorOfApproval, notifyAuthorOfRejection } from "../lib/mail.js";
import {
  getStitchedHtml,
  createStitchedHtmlUploadUrl,
  stitchedHtmlExists,
  deleteStitchedHtml,
} from "../lib/htmlStore.js";
import { createRawUploadUrl, getRawUploadSize, downloadRawUpload, deleteRawUpload } from "../lib/uploadStore.js";

// Limits mirrored by the frontend (CreatePostModal.jsx) for fast feedback;
// this file is the actual enforcement.
const TITLE_MAX = 100;
const ABSTRACT_MAX = 3800;
const REJECTION_REASON_MAX = 1000;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const POST_LIMIT = 5;
const POST_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const SEARCH_WORDS_MAX = 10;

// The only file types a raw upload may be, keyed by lowercased extension
// (parsed from the filename - browsers report inconsistent MIME types for
// .md/.qmd/.rmd) to the content-type sent on the PUT.
const ALLOWED_UPLOAD_EXTENSIONS = {
  md: "text/markdown",
  qmd: "text/markdown",
  rmd: "text/markdown",
  zip: "application/zip",
};

function extensionOf(filename) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(typeof filename === "string" ? filename : "");
  return match ? match[1].toLowerCase() : null;
}

const findPost = (id) => prisma.postMetadata.findUnique({ where: { id }, include });
const viewer = (req) => ({ userId: req.userId, userRole: req.userRole });

// Caps submission volume per user across all statuses, so the moderation
// queue can't be spammed with pending/rejected posts either.
async function assertUnderPostLimit(userId) {
  const recent = await prisma.postMetadata.count({
    where: { authorId: userId, createdAt: { gte: new Date(Date.now() - POST_LIMIT_WINDOW_MS) } },
  });
  if (recent >= POST_LIMIT) {
    throw new HttpError(429, `You can only submit ${POST_LIMIT} posts per 24 hours. Please try again later.`);
  }
}

// Drops an upload ticket and the object it points at - used whenever a
// submission is abandoned or rejected before it becomes a post.
async function discardUpload(ticket) {
  await deleteRawUpload(ticket.rawSlug);
  await prisma.pendingPostUpload.delete({ where: { id: ticket.id } }).catch(() => {});
}

const router = Router();

// Every "/:id" route below gets the post loaded as req.post, or a 404.
router.param(
  "id",
  asyncHandler(async (req, res, next, id) => {
    req.post = await findPost(id);
    if (!req.post) throw new HttpError(404, "Post not found");
    next();
  })
);

// Feed: approved posts, plus the caller's own pending posts, plus (for a
// moderator/admin) everyone's pending posts. Optional topicSlug filter.
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { topicSlug } = req.query;
    // Express's query parser turns ?topicSlug[not]=x into an object, which
    // Prisma would happily treat as a filter operator - strings only.
    if (topicSlug !== undefined && typeof topicSlug !== "string") {
      throw new HttpError(400, "topicSlug must be a string");
    }
    const posts = await prisma.postMetadata.findMany({
      where: {
        ...(topicSlug && { topicSlug }),
        OR: [
          { status: "APPROVED" },
          ...(req.userId ? [{ authorId: req.userId, status: "PENDING" }] : []),
          ...(isModerator(req.userRole) ? [{ status: "PENDING" }] : []),
        ],
      },
      include,
      orderBy: { createdAt: "desc" },
    });
    res.json(posts.map((p) => serializePost(p, viewer(req))));
  })
);

// Moderation queue.
router.get(
  "/pending",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const posts = await prisma.postMetadata.findMany({
      where: { status: "PENDING" },
      include,
      orderBy: { createdAt: "asc" },
    });
    res.json(posts.map((p) => serializePost(p, viewer(req))));
  })
);

// Home page carousel: top posts site-wide by engagement.
router.get(
  "/top",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const posts = await prisma.postMetadata.findMany({ where: { status: "APPROVED" }, include });
    const ranked = posts.map((p) => serializePost(p, viewer(req))).sort((a, b) => rankScore(b) - rankScore(a));
    res.json(ranked.slice(0, limit));
  })
);

// Header search: approved posts whose title or abstract contains every word
// of the query (case-insensitive). Never looks at the HTML body.
router.get(
  "/search",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.json([]);

    const words = q.split(/\s+/).slice(0, SEARCH_WORDS_MAX);
    const posts = await prisma.postMetadata.findMany({
      where: {
        status: "APPROVED",
        AND: words.map((word) => ({
          OR: [
            { title: { contains: word, mode: "insensitive" } },
            { abstract: { contains: word, mode: "insensitive" } },
          ],
        })),
      },
      include,
      orderBy: { createdAt: "desc" },
    });
    res.json(posts.map((p) => serializePost(p, viewer(req))));
  })
);

// Step 1 of creating a post: mints a signed URL the author's browser
// uploads the raw file to directly, so it never has to fit inside Vercel's
// ~4.5mb request-body limit. The extension is validated here and baked into
// a fixed object name ("<postId>/upload.<ext>") - the client's filename
// never reaches the storage path.
router.post(
  "/upload-url",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ext = extensionOf(req.body.filename);
    if (!ext || !ALLOWED_UPLOAD_EXTENSIONS[ext]) {
      throw new HttpError(400, "File must be a .md, .qmd, .rmd, or .zip");
    }
    // Early check so a user at their limit isn't asked to upload for
    // nothing - POST / re-checks this for real.
    await assertUnderPostLimit(req.userId);

    // One outstanding ticket per user: an abandoned upload (never finalized
    // by POST /) is otherwise orphaned in storage forever.
    const stale = await prisma.pendingPostUpload.findMany({ where: { authorId: req.userId } });
    await Promise.all(stale.map(discardUpload));

    const postId = crypto.randomUUID();
    const rawSlug = `${postId}/upload.${ext}`;
    await prisma.pendingPostUpload.create({ data: { id: postId, authorId: req.userId, rawSlug } });
    const signedUrl = await createRawUploadUrl(rawSlug);
    res.json({ postId, rawSlug, signedUrl, contentType: ALLOWED_UPLOAD_EXTENSIONS[ext] });
  })
);

// Step 2: the upload landed, now create the (PENDING) post record.
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = requireText(req.body.id, "id", 64);
    const topicSlug = requireText(req.body.topicSlug, "topicSlug", 32);
    const title = requireText(req.body.title, "title", TITLE_MAX);
    const abstract = requireText(req.body.abstract, "abstract", ABSTRACT_MAX);
    const rawSlug = requireText(req.body.rawSlug, "rawSlug", 128);
    // Display-only, but it becomes a zip entry name in GET /:id/download -
    // basename() keeps a crafted "../x" from ever escaping an unzip.
    const originalFilename = path.basename(requireText(req.body.originalFilename, "originalFilename", 255));
    if (!TOPIC_SLUGS.includes(topicSlug)) throw new HttpError(400, "Unknown topic");

    // The ticket binds the rawSlug to the user who minted it, so a post can
    // only be created from an upload the same user actually initiated.
    const ticket = await prisma.pendingPostUpload.findUnique({ where: { id } });
    if (!ticket || ticket.authorId !== req.userId || ticket.rawSlug !== rawSlug) {
      throw new HttpError(403, "Upload ticket not found or already used - try uploading again");
    }
    if (extensionOf(originalFilename) !== extensionOf(rawSlug)) {
      throw new HttpError(400, "originalFilename doesn't match the uploaded file type");
    }

    try {
      await assertUnderPostLimit(req.userId);
    } catch (err) {
      await discardUpload(ticket);
      throw err;
    }

    const size = await getRawUploadSize(rawSlug);
    if (size === null) throw new HttpError(400, "Upload not found - try uploading again");
    if (size > MAX_UPLOAD_BYTES) {
      await discardUpload(ticket);
      throw new HttpError(400, "File is too large - uploads must be under 50 MB");
    }

    const [post] = await prisma.$transaction([
      prisma.postMetadata.create({
        data: {
          id,
          topicSlug,
          title,
          abstract,
          authorId: req.userId,
          authorName: req.userName,
          authorAvatarUrl: req.userAvatarUrl,
          body: { create: { rawSlug, rawOriginalName: originalFilename } },
        },
        include,
      }),
      prisma.pendingPostUpload.delete({ where: { id } }),
    ]);
    await notifyAdminsOfPendingPost(post);
    res.status(201).json(serializePost(post, viewer(req)));
  })
);

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { post } = req;
    const canView = post.status === "APPROVED" || isModerator(req.userRole) || req.userId === post.authorId;
    if (!canView) throw new HttpError(404, "Post not found");
    // Only this route pulls the HTML out of storage - list views never do.
    const html = await getStitchedHtml(post.body?.htmlSlug);
    res.json(serializePost(post, viewer(req), { html }));
  })
);

// Permanent and irreversible (unlike archive): the DB cascades away body,
// votes, pins and comments; both storage objects are removed here.
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await deleteStitchedHtml(req.post.body?.htmlSlug);
    await deleteRawUpload(req.post.body?.rawSlug);
    await prisma.postMetadata.delete({ where: { id: req.post.id } });
    res.status(204).end();
  })
);

// Step 1 of approving: a signed URL for the admin's browser to upload the
// stitched HTML to directly (same reasoning as /upload-url above).
router.post(
  "/:id/approve/upload-url",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    if (req.post.status !== "PENDING") throw new HttpError(400, "Only pending posts can be approved");
    const htmlSlug = `${req.post.id}.html`;
    res.json({ signedUrl: await createStitchedHtmlUploadUrl(htmlSlug), htmlSlug });
  })
);

// Step 2: confirms the HTML actually landed, then flips the post to APPROVED.
router.post(
  "/:id/approve",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    if (req.post.status !== "PENDING") throw new HttpError(400, "Only pending posts can be approved");
    const htmlSlug = `${req.post.id}.html`;
    if (!(await stitchedHtmlExists(htmlSlug))) {
      throw new HttpError(400, "Stitched HTML upload not found - try uploading again");
    }
    const updated = await prisma.postMetadata.update({
      where: { id: req.post.id },
      data: { status: "APPROVED", reviewedById: req.userId, reviewedAt: new Date(), body: { update: { htmlSlug } } },
      include,
    });
    await notifyAuthorOfApproval(updated);
    res.json(serializePost(updated, viewer(req)));
  })
);

router.post(
  "/:id/reject",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const rejectionReason = requireText(req.body.rejectionReason, "rejectionReason", REJECTION_REASON_MAX);
    if (req.post.status !== "PENDING") throw new HttpError(400, "Only pending posts can be rejected");
    const updated = await prisma.postMetadata.update({
      where: { id: req.post.id },
      data: { status: "REJECTED", reviewedById: req.userId, reviewedAt: new Date(), rejectionReason },
      include,
    });
    await notifyAuthorOfRejection(updated);
    res.json(serializePost(updated, viewer(req)));
  })
);

// Bundles title/abstract/original upload into a zip for offline review.
router.get(
  "/:id/download",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { post } = req;
    let rawBuffer;
    try {
      rawBuffer = Buffer.from(await (await downloadRawUpload(post.body.rawSlug)).arrayBuffer());
    } catch (err) {
      console.error(`Failed to download raw upload for post ${post.id}:`, err);
      throw new HttpError(502, "Could not fetch the original upload from storage");
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${post.id}.zip"`);
    const archive = new ZipArchive();
    archive.on("error", (err) => res.destroy(err));
    archive.pipe(res);
    archive.append(post.title, { name: "title.txt" });
    archive.append(post.abstract, { name: "abstract.txt" });
    archive.append(rawBuffer, { name: post.body.rawOriginalName });
    await archive.finalize();
  })
);

// Votes and pins only apply to approved posts; each responds with the
// freshly re-fetched post.
function requireApproved(req, res, next) {
  if (req.post.status !== "APPROVED") throw new HttpError(404, "Post not found");
  next();
}

async function vote(req, res, value) {
  const where = { postId_userId: { postId: req.post.id, userId: req.userId } };
  await toggleVote(prisma.vote, where, where.postId_userId, value);
  res.json(serializePost(await findPost(req.post.id), viewer(req)));
}

router.post("/:id/upvote", requireAuth, requireApproved, asyncHandler((req, res) => vote(req, res, 1)));
router.post("/:id/downvote", requireAuth, requireApproved, asyncHandler((req, res) => vote(req, res, -1)));

router.post(
  "/:id/pin",
  requireAuth,
  requireApproved,
  asyncHandler(async (req, res) => {
    const where = { postId_userId: { postId: req.post.id, userId: req.userId } };
    try {
      if (await prisma.pin.findUnique({ where })) {
        await prisma.pin.delete({ where });
      } else {
        await prisma.pin.create({ data: where.postId_userId });
      }
    } catch (err) {
      // Same overlapping-toggle race as toggleVote - the loser no-ops.
      if (err.code !== "P2002" && err.code !== "P2025") throw err;
    }
    res.json(serializePost(await findPost(req.post.id), viewer(req)));
  })
);

router.post(
  "/:id/lock",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    if (req.post.status !== "APPROVED") throw new HttpError(400, "Only approved posts can be locked");
    const updated = await prisma.postMetadata.update({
      where: { id: req.post.id },
      data: { locked: !req.post.locked },
      include,
    });
    res.json(serializePost(updated, viewer(req)));
  })
);

// One-way: moves a post to the Archive topic and locks it. To undo, a
// moderator moves it back and unlocks it by hand.
router.post(
  "/:id/archive",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    if (req.post.status !== "APPROVED") throw new HttpError(400, "Only approved posts can be archived");
    const updated = await prisma.postMetadata.update({
      where: { id: req.post.id },
      data: { topicSlug: "archive", locked: true },
      include,
    });
    res.json(serializePost(updated, viewer(req)));
  })
);

export default router;
