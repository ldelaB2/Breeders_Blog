import { Router } from "express";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "../../lib/db/prisma.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { HttpError } from "../../lib/http/httpError.js";
import { requireText } from "../../lib/http/validate.js";
import {
  ABSTRACT_MAX,
  MAX_UPLOAD_BYTES,
  POST_LIMIT,
  POST_LIMIT_WINDOW_MS,
  TITLE_MAX,
  UPLOAD_TYPES,
} from "../../config/limits.js";
import { TOPIC_SLUGS } from "../../config/topics.js";
import { postInclude, rawSlugFor } from "./posts.repo.js";
import { serializePost } from "./serializePost.js";

function extensionOf(filename) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(typeof filename === "string" ? filename : "");
  return match ? match[1].toLowerCase() : null;
}

// Caps submission volume per user across all statuses.
async function assertUnderPostLimit(userId) {
  const recent = await prisma.postMetadata.count({
    where: { authorId: userId, createdAt: { gte: new Date(Date.now() - POST_LIMIT_WINDOW_MS) } },
  });
  if (recent >= POST_LIMIT) {
    throw new HttpError(429, `You can only submit ${POST_LIMIT} posts per 24 hours. Please try again later.`);
  }
}

// Submitting a post is two steps around a direct browser-to-storage upload,
// so the file never has to fit inside Vercel's ~4.5mb request-body limit:
//   1. POST /upload-url  - validate the file type, mint an upload ticket + signed URL
//   2. POST /            - check the upload landed, create the PENDING post
export function submitRoutes({ auth, stores, notify }) {
  const router = Router();

  // Drops an upload ticket and the object it points at - used whenever a
  // submission is abandoned or rejected before it becomes a post.
  async function discardUpload(ticket) {
    await stores.upload.remove(ticket.rawSlug);
    await prisma.pendingPostUpload.delete({ where: { id: ticket.id } }).catch(() => {});
  }

  // The extension is validated here and baked into a fixed object name -
  // the client's filename never reaches the storage path.
  router.post(
    "/upload-url",
    auth.requireAuth,
    asyncHandler(async (req, res) => {
      const ext = extensionOf(req.body.filename);
      if (!ext || !UPLOAD_TYPES[ext]) throw new HttpError(400, "File must be a .md, .qmd, .rmd, or .zip");
      // Early check so a user at their limit isn't asked to upload for
      // nothing - POST / re-checks this for real.
      await assertUnderPostLimit(req.user.id);

      // One outstanding ticket per user: an abandoned upload (never finalized
      // by POST /) is otherwise orphaned in storage forever.
      const stale = await prisma.pendingPostUpload.findMany({ where: { authorId: req.user.id } });
      await Promise.all(stale.map(discardUpload));

      const postId = crypto.randomUUID();
      const rawSlug = rawSlugFor(postId, ext);
      await prisma.pendingPostUpload.create({ data: { id: postId, authorId: req.user.id, rawSlug } });
      const signedUrl = await stores.upload.signedUploadUrl(rawSlug);
      res.json({ postId, rawSlug, signedUrl, contentType: UPLOAD_TYPES[ext] });
    }),
  );

  router.post(
    "/",
    auth.requireAuth,
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
      if (!ticket || ticket.authorId !== req.user.id || ticket.rawSlug !== rawSlug) {
        throw new HttpError(403, "Upload ticket not found or already used - try uploading again");
      }
      if (extensionOf(originalFilename) !== extensionOf(rawSlug)) {
        throw new HttpError(400, "originalFilename doesn't match the uploaded file type");
      }

      try {
        await assertUnderPostLimit(req.user.id);
      } catch (err) {
        await discardUpload(ticket);
        throw err;
      }

      const size = await stores.upload.size(rawSlug);
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
            authorId: req.user.id,
            authorName: req.user.name,
            authorAvatarUrl: req.user.avatarUrl,
            body: { create: { rawSlug, rawOriginalName: originalFilename } },
          },
          include: postInclude,
        }),
        prisma.pendingPostUpload.delete({ where: { id } }),
      ]);
      await notify.notifyAdminsOfPendingPost(post);
      res.status(201).json(serializePost(post, req.user));
    }),
  );

  return router;
}
