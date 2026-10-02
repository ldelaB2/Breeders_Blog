import { Router } from "express";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "../../lib/db/prisma.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { HttpError } from "../../lib/http/httpError.js";
import { optionalString, requireText } from "../../lib/http/validate.js";
import {
  ABSTRACT_MAX,
  FILENAME_MAX,
  ID_MAX,
  POST_LIMIT,
  POST_LIMIT_WINDOW_MS,
  SLUG_MAX,
  TITLE_MAX,
} from "../../config/limits.js";
import { TOPIC_SLUGS } from "../../config/topics.js";
import { assertUploaded, extensionOf, mintUpload, removePostFiles, uploadSlug } from "./postFiles.js";
import { postInclude } from "./posts.repo.js";
import { serializePost } from "./serializePost.js";

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
//                          (plus one for the optional share image)
//   2. POST /            - check the upload(s) landed, create the PENDING post
export function submitRoutes({ auth, stores, notify }) {
  const router = Router();

  // Drops an upload ticket and the object it points at - used whenever a
  // submission is abandoned or rejected before it becomes a post.
  async function discardUpload(ticket) {
    await removePostFiles(stores, ticket);
    await prisma.pendingPostUpload.delete({ where: { id: ticket.id } }).catch(() => {});
  }

  // The extension is validated here and baked into a fixed object name -
  // the client's filename never reaches the storage path.
  router.post(
    "/upload-url",
    auth.requireAuth,
    asyncHandler(async (req, res) => {
      const postId = crypto.randomUUID();
      const upload = uploadSlug("upload", postId, req.body.filename);
      const imageFilename = optionalString(req.body.imageFilename, "imageFilename");
      // Early check so a user at their limit isn't asked to upload for
      // nothing - POST / re-checks this for real.
      await assertUnderPostLimit(req.user.id);

      // One outstanding ticket per user: an abandoned upload (never finalized
      // by POST /) is otherwise orphaned in storage forever.
      const stale = await prisma.pendingPostUpload.findMany({ where: { authorId: req.user.id } });
      await Promise.all(stale.map(discardUpload));

      const image = imageFilename ? await mintUpload(stores.image, "image", postId, imageFilename) : null;
      await prisma.pendingPostUpload.create({
        data: { id: postId, authorId: req.user.id, rawSlug: upload.slug, imageSlug: image?.slug ?? null },
      });
      const signedUrl = await stores.upload.signedUploadUrl(upload.slug);
      res.json({ postId, rawSlug: upload.slug, signedUrl, contentType: upload.contentType, image });
    }),
  );

  router.post(
    "/",
    auth.requireAuth,
    asyncHandler(async (req, res) => {
      const id = requireText(req.body.id, "id", ID_MAX);
      const topicSlug = requireText(req.body.topicSlug, "topicSlug", SLUG_MAX);
      const title = requireText(req.body.title, "title", TITLE_MAX);
      const abstract = requireText(req.body.abstract, "abstract", ABSTRACT_MAX);
      const rawSlug = requireText(req.body.rawSlug, "rawSlug", SLUG_MAX);
      const imageSlug = optionalString(req.body.imageSlug, "imageSlug") || null;
      // Display-only, but it becomes a zip entry name in GET /:id/download -
      // basename() keeps a crafted "../x" from ever escaping an unzip.
      const originalFilename = path.basename(requireText(req.body.originalFilename, "originalFilename", FILENAME_MAX));
      if (!TOPIC_SLUGS.includes(topicSlug)) throw new HttpError(400, "Unknown topic");

      // The ticket binds the rawSlug to the user who minted it, so a post can
      // only be created from an upload the same user actually initiated.
      const ticket = await prisma.pendingPostUpload.findUnique({ where: { id } });
      if (!ticket || ticket.authorId !== req.user.id || ticket.rawSlug !== rawSlug || ticket.imageSlug !== imageSlug) {
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

      // A missing upload keeps the ticket for a retry; an oversized one can
      // never be used, so it's discarded.
      const onTooLarge = () => discardUpload(ticket);
      await assertUploaded(stores.upload, "upload", rawSlug, { onTooLarge });
      if (imageSlug) await assertUploaded(stores.image, "image", imageSlug, { onTooLarge });

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
            body: { create: { rawSlug, rawOriginalName: originalFilename, imageSlug } },
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
