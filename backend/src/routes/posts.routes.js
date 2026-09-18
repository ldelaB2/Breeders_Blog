import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth, requireRole } from "../middleware/requireAuth.js";
import { serializePost } from "../lib/serializePost.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import {
  getStitchedHtml,
  createStitchedHtmlUploadUrl,
  stitchedHtmlExists,
  deleteStitchedHtml,
} from "../lib/htmlStore.js";
import {
  createRawUploadUrl,
  getRawUploadInfo,
  downloadRawUpload,
  deleteRawUpload,
} from "../lib/uploadStore.js";
import { postInclude as include } from "../lib/postInclude.js";
import { rankScore } from "../lib/rankScore.js";
import { notifyAdminsOfPendingPost, notifyAuthorOfApproval, notifyAuthorOfRejection } from "../lib/mail.js";
import { ZipArchive } from "archiver";
import crypto from "node:crypto";

// The only file types a post's raw upload may be; keyed by lowercased
// extension (parsed from the client-supplied filename, not the browser's
// often-inconsistent MIME type for .md/.qmd) to the content-type recorded
// in the DB and sent on the PUT.
const ALLOWED_UPLOAD_EXTENSIONS = {
  md: "text/markdown",
  qmd: "text/markdown",
  zip: "application/zip",
};
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function extensionFromFilename(filename) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(typeof filename === "string" ? filename : "");
  return match ? match[1].toLowerCase() : null;
}

const router = Router();

async function findPost(id) {
  return prisma.postMetadata.findUnique({ where: { id }, include });
}

// Lightweight existence/status check for routes that only need to validate
// before mutating (upvote/downvote/pin) - avoids pulling the full votes/
// pins/body relation graph twice per request when only `status` is needed
// up front; the full findPost() below is still used once, to build the
// actual response after the mutation.
async function findPostStatus(id) {
  return prisma.postMetadata.findUnique({ where: { id }, select: { status: true } });
}

async function toggleVote(postId, userId, value) {
  const existing = await prisma.vote.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  try {
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
  } catch (err) {
    // A second, overlapping toggle for the same (postId, userId) - e.g. a
    // burst of rapid clicks - can race this read-then-write: both read
    // `existing` before either writes, then collide on the write (P2002 if
    // both tried to create, P2025 if both tried to delete/update a row the
    // other already removed/changed). Whichever request wins already left
    // the vote in a valid state, so the loser can just no-op instead of
    // 500ing - the caller re-fetches the post/comment for its response
    // either way, so the client still gets the correct, current state.
    if (err.code !== "P2002" && err.code !== "P2025") throw err;
  }
}

async function togglePin(postId, userId) {
  const where = { postId_userId: { postId, userId } };
  const existing = await prisma.pin.findUnique({ where });
  try {
    if (existing) {
      await prisma.pin.delete({ where });
    } else {
      await prisma.pin.create({ data: { postId, userId } });
    }
  } catch (err) {
    // Same read-then-write race as toggleVote above - a second, overlapping
    // pin toggle for the same (postId, userId) can collide on the write.
    // The loser can just no-op instead of 500ing, since the response is
    // built from a fresh re-fetch either way.
    if (err.code !== "P2002" && err.code !== "P2025") throw err;
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
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const posts = await prisma.postMetadata.findMany({
      where: { status: "PENDING" },
      include,
      orderBy: { createdAt: "asc" },
    });
    res.json(posts.map((p) => serializePost(p, { userRole: req.userRole })));
  })
);

// Home page carousel: top posts site-wide by engagement, regardless of
// topic. Must come before "/:id" so it isn't captured by it.
router.get(
  "/top",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const posts = await prisma.postMetadata.findMany({
      where: { status: "APPROVED" },
      include,
    });
    const serialized = posts
      .map((p) => serializePost(p, { userId: req.userId, userRole: req.userRole }))
      .sort((a, b) => rankScore(b) - rankScore(a));
    res.json(serialized.slice(0, limit));
  })
);

// Search box in the header: matches approved posts whose title or abstract
// contains every word in the query (case-insensitive). Only ever looks at
// those two plain-text fields, never the stitched HTML body. Must come
// before "/:id" so it isn't captured by it.
router.get(
  "/search",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.json([]);

    const words = q.split(/\s+/).filter(Boolean);
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
    res.json(posts.map((p) => serializePost(p, { userId: req.userId, userRole: req.userRole })));
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

// Permanently deletes a post and everything attached to it (body,
// votes, pins, comments, comment votes - all cascade at the DB level from
// PostMetadata's foreign keys) plus its stitched HTML file, if any.
// Admin-only and irreversible - there's no undo, unlike archive.
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const post = await findPost(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    await deleteStitchedHtml(post.body?.htmlSlug);
    await prisma.postMetadata.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

const POST_LIMIT = 5;
const POST_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Caps submission volume per user, not just approved posts - counts all
// statuses so this also protects the moderation queue from being spammed
// with pending/rejected posts, not only the DB/backend from write load.
async function isOverPostLimit(userId) {
  const recentCount = await prisma.postMetadata.count({
    where: { authorId: userId, createdAt: { gte: new Date(Date.now() - POST_LIMIT_WINDOW_MS) } },
  });
  return recentCount >= POST_LIMIT;
}

// Step 1 of creating a post: mints a signed URL the author's browser
// uploads their raw .md/.qmd/.zip file to directly (Supabase Storage,
// bypassing this server entirely) so the file never has to fit inside
// Vercel's ~4.5mb function request-body limit, and can be as large as the
// 50mb we allow. The extension is validated here (not the client-reported
// MIME type, which browsers report inconsistently for .md/.qmd) and baked
// into a fixed object name ("upload.<ext>") - the client's actual filename
// never reaches the storage path, so there's no path-traversal surface.
router.post(
  "/upload-url",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ext = extensionFromFilename(req.body.filename);
    if (!ext || !ALLOWED_UPLOAD_EXTENSIONS[ext]) {
      return res.status(400).json({ error: "File must be a .md, .qmd, or .zip" });
    }
    // Early, non-authoritative check so a user already at their limit isn't
    // asked to upload a file for nothing - POST / re-checks this for real.
    if (await isOverPostLimit(req.userId)) {
      return res
        .status(429)
        .json({ error: `You can only submit ${POST_LIMIT} posts per 24 hours. Please try again later.` });
    }

    const postId = crypto.randomUUID();
    const rawSlug = `${postId}/upload.${ext}`;
    await prisma.pendingPostUpload.create({ data: { id: postId, authorId: req.userId, rawSlug } });
    const signedUrl = await createRawUploadUrl(rawSlug);
    res.json({ postId, rawSlug, signedUrl, contentType: ALLOWED_UPLOAD_EXTENSIONS[ext] });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = requireString(req.body.id, "id", res);
    if (!id) return;
    const topicSlug = requireString(req.body.topicSlug, "topicSlug", res);
    if (!topicSlug) return;
    const title = requireString(req.body.title, "title", res);
    if (!title) return;
    const abstract = requireString(req.body.abstract, "abstract", res);
    if (!abstract) return;
    const rawSlug = requireString(req.body.rawSlug, "rawSlug", res);
    if (!rawSlug) return;
    const originalFilename = requireString(req.body.originalFilename, "originalFilename", res);
    if (!originalFilename) return;

    // The rawSlug can only turn into a post if the same authenticated user
    // who minted it (via POST /upload-url) is the one finishing it here -
    // otherwise a client could hand this route an arbitrary/unrelated
    // rawSlug it never uploaded to.
    const pending = await prisma.pendingPostUpload.findUnique({ where: { id } });
    if (!pending || pending.authorId !== req.userId || pending.rawSlug !== rawSlug) {
      return res.status(403).json({ error: "Upload ticket not found or already used - try uploading again" });
    }

    if (await isOverPostLimit(req.userId)) {
      // Already-uploaded, now-blocked submission - don't leave the object
      // (or its ticket) behind in storage/the DB.
      await deleteRawUpload(rawSlug);
      await prisma.pendingPostUpload.delete({ where: { id } }).catch(() => {});
      return res
        .status(429)
        .json({ error: `You can only submit ${POST_LIMIT} posts per 24 hours. Please try again later.` });
    }

    const ext = extensionFromFilename(rawSlug);
    const rawContentType = ALLOWED_UPLOAD_EXTENSIONS[ext];
    const info = await getRawUploadInfo(rawSlug);
    if (!info) {
      return res.status(400).json({ error: "Upload not found - try uploading again" });
    }
    if (info.metadata?.size > MAX_UPLOAD_BYTES) {
      await deleteRawUpload(rawSlug);
      await prisma.pendingPostUpload.delete({ where: { id } }).catch(() => {});
      return res.status(400).json({ error: "File is too large - uploads must be under 50 MB" });
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
          body: {
            create: {
              rawSlug,
              rawOriginalName: originalFilename.slice(0, 255),
              rawContentType,
              rawSize: info.metadata?.size ?? 0,
            },
          },
        },
        include,
      }),
      prisma.pendingPostUpload.delete({ where: { id } }),
    ]);
    await notifyAdminsOfPendingPost(post);
    res.status(201).json(serializePost(post, { userId: req.userId, userRole: req.userRole }));
  })
);

// Step 1 of approving a pending post: mints a signed URL the reviewer's
// browser uploads the stitched HTML file to directly (Supabase Storage,
// bypassing this server entirely) so the file never has to fit inside
// Vercel's ~4.5mb function request-body limit.
router.post(
  "/:id/approve/upload-url",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const post = await findPost(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending posts can be approved" });
    }

    const htmlSlug = `${post.id}.html`;
    const signedUrl = await createStitchedHtmlUploadUrl(htmlSlug);
    res.json({ signedUrl, htmlSlug });
  })
);

// Step 2: called once the browser's direct upload (above) has finished.
// Confirms the file actually landed in storage, then flips the post to
// APPROVED and points its body at that slug.
router.post(
  "/:id/approve",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const post = await findPost(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending posts can be approved" });
    }

    const htmlSlug = `${post.id}.html`;
    if (!(await stitchedHtmlExists(htmlSlug))) {
      return res.status(400).json({ error: "Stitched HTML upload not found - try uploading again" });
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
    await notifyAuthorOfApproval(updated);
    res.json(serializePost(updated, { userId: req.userId, userRole: req.userRole }));
  })
);

router.post(
  "/:id/reject",
  requireAuth,
  requireRole("ADMIN"),
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
    await notifyAuthorOfRejection(updated);
    res.json(serializePost(updated, { userId: req.userId, userRole: req.userRole }));
  })
);

// Bundles a post's title/abstract/original raw upload into a zip for the
// admin to review offline before deciding to approve/reject.
router.get(
  "/:id/download",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const post = await findPost(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    let rawBuffer;
    try {
      const blob = await downloadRawUpload(post.body.rawSlug);
      rawBuffer = Buffer.from(await blob.arrayBuffer());
    } catch (err) {
      console.error(`Failed to download raw upload for post ${post.id}:`, err);
      return res.status(502).json({ error: "Could not fetch the original upload from storage" });
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

router.post(
  "/:id/upvote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await findPostStatus(req.params.id);
    if (!post || post.status !== "APPROVED") return res.status(404).json({ error: "Post not found" });
    await toggleVote(req.params.id, req.userId, 1);
    res.json(serializePost(await findPost(req.params.id), { userId: req.userId, userRole: req.userRole }));
  })
);

router.post(
  "/:id/downvote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await findPostStatus(req.params.id);
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
    const post = await findPostStatus(postId);
    if (!post || post.status !== "APPROVED") return res.status(404).json({ error: "Post not found" });

    await togglePin(postId, req.userId);
    res.json(serializePost(await findPost(postId), { userId: req.userId, userRole: req.userRole }));
  })
);

router.post(
  "/:id/lock",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const post = await findPost(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.status !== "APPROVED") {
      return res.status(400).json({ error: "Only approved posts can be locked" });
    }

    const updated = await prisma.postMetadata.update({
      where: { id: req.params.id },
      data: { locked: !post.locked },
      include,
    });
    res.json(serializePost(updated, { userId: req.userId, userRole: req.userRole }));
  })
);

// One-way: moves a post to the Archive topic and locks it. There's no
// "unarchive" - a moderator would move it back and unlock it manually.
router.post(
  "/:id/archive",
  requireAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const post = await findPost(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.status !== "APPROVED") {
      return res.status(400).json({ error: "Only approved posts can be archived" });
    }

    const updated = await prisma.postMetadata.update({
      where: { id: req.params.id },
      data: { topicSlug: "archive", locked: true },
      include,
    });
    res.json(serializePost(updated, { userId: req.userId, userRole: req.userRole }));
  })
);

export default router;
