import { Router } from "express";
import { ZipArchive } from "archiver";
import { prisma } from "../../lib/db/prisma.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { HttpError } from "../../lib/http/httpError.js";
import { optionalString, requireText } from "../../lib/http/validate.js";
import { REJECTION_REASON_MAX } from "../../config/limits.js";
import {
  assertUploaded,
  extensionOf,
  htmlSlugFor,
  isUploadSlugFor,
  mintUpload,
  removePostFiles,
  safeFilename,
} from "../posts/postFiles.js";
import { listPosts, loadPostParam, updatePost } from "../posts/posts.repo.js";
import { assertStatus } from "../posts/postStatus.js";
import { serializePost, serializePosts } from "../posts/serializePost.js";

// The admin review queue (approve/reject/download/delete) and moderator
// curation (lock/archive). Every route answers with the updated post.
export function moderationRoutes({ auth, stores, notify }) {
  const { requireAdmin, requireModerator } = auth;
  const router = Router();
  loadPostParam(router);

  const respond = (req, res, post) => res.json(serializePost(post, req.user));
  // Who reviewed a post and when - set by both approve and reject.
  const reviewedBy = (req) => ({ reviewedById: req.user.id, reviewedAt: new Date() });

  router.get(
    "/pending",
    requireAdmin,
    asyncHandler(async (req, res) => {
      res.json(serializePosts(await listPosts({ status: "PENDING" }, { createdAt: "asc" }), req.user));
    }),
  );

  // Step 1 of approving: a signed URL for the admin's browser to upload the
  // stitched HTML to directly, bypassing Vercel's request-body cap (a
  // self-contained Quarto export with bundled Plotly.js can exceed it).
  // With an `imageFilename`, also a signed URL for a replacement share image.
  router.post(
    "/:id/approve/upload-url",
    requireAdmin,
    asyncHandler(async (req, res) => {
      assertStatus(req.post, "PENDING", "approved");
      const imageFilename = optionalString(req.body.imageFilename, "imageFilename");
      const htmlSlug = htmlSlugFor(req.post.id);
      const image = imageFilename ? await mintUpload(stores.image, "image", req.post.id, imageFilename) : null;
      res.json({ signedUrl: await stores.html.signedUploadUrl(htmlSlug), htmlSlug, image });
    }),
  );

  // Step 2: confirms the HTML (and any replacement image) actually landed,
  // then flips the post to APPROVED.
  router.post(
    "/:id/approve",
    requireAdmin,
    asyncHandler(async (req, res) => {
      assertStatus(req.post, "PENDING", "approved");
      const imageSlug = optionalString(req.body.imageSlug, "imageSlug") || null;
      if (imageSlug && !isUploadSlugFor("image", req.post.id, imageSlug)) throw new HttpError(400, "Invalid imageSlug");
      const htmlSlug = htmlSlugFor(req.post.id);
      if (!(await stores.html.exists(htmlSlug))) {
        throw new HttpError(400, "Stitched HTML upload not found - try uploading again");
      }
      if (imageSlug) await assertUploaded(stores.image, "image", imageSlug);
      const oldImageSlug = req.post.body?.imageSlug;
      const updated = await updatePost(req.post.id, {
        status: "APPROVED",
        ...reviewedBy(req),
        body: { update: { htmlSlug, ...(imageSlug && { imageSlug }) } },
      });
      // A replacement with a different extension leaves the author's original behind.
      if (imageSlug && oldImageSlug !== imageSlug) await stores.image.remove(oldImageSlug);
      await notify.notifyAuthorOfApproval(updated);
      respond(req, res, updated);
    }),
  );

  router.post(
    "/:id/reject",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const rejectionReason = requireText(req.body.rejectionReason, "rejectionReason", REJECTION_REASON_MAX);
      assertStatus(req.post, "PENDING", "rejected");
      const updated = await updatePost(req.post.id, { status: "REJECTED", ...reviewedBy(req), rejectionReason });
      await notify.notifyAuthorOfRejection(updated);
      respond(req, res, updated);
    }),
  );

  // Bundles title/abstract/original upload (and share image, if any) into a
  // zip for offline review.
  router.get(
    "/:id/download",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const { post } = req;
      let raw;
      try {
        raw = await stores.upload.download(post.body.rawSlug);
      } catch (err) {
        console.error(`Failed to download raw upload for post ${post.id}:`, err);
        throw new HttpError(502, "Could not fetch the original upload from storage");
      }
      // Optional, so a missing image doesn't fail the review download.
      const image = post.body.imageSlug ? await stores.image.download(post.body.imageSlug).catch(() => null) : null;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${post.id}.zip"`);
      const archive = new ZipArchive();
      archive.on("error", (err) => res.destroy(err));
      archive.pipe(res);
      archive.append(post.title, { name: "title.txt" });
      archive.append(post.abstract, { name: "abstract.txt" });
      // Re-sanitized here too, for rows stored before safeFilename existed.
      archive.append(raw, { name: safeFilename(post.body.rawOriginalName) });
      if (image) archive.append(image, { name: `share-image.${extensionOf(post.body.imageSlug)}` });
      await archive.finalize();
    }),
  );

  // Permanent and irreversible (unlike archive): the DB cascades away body,
  // votes, pins and comments; the storage objects are removed here.
  router.delete(
    "/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      await removePostFiles(stores, req.post.body ?? {});
      await prisma.postMetadata.delete({ where: { id: req.post.id } });
      res.status(204).end();
    }),
  );

  router.post(
    "/:id/lock",
    requireModerator,
    asyncHandler(async (req, res) => {
      assertStatus(req.post, "APPROVED", "locked");
      respond(req, res, await updatePost(req.post.id, { locked: !req.post.locked }));
    }),
  );

  // One-way: moves a post to the Archive topic and locks it. To undo, a
  // moderator moves it back and unlocks it by hand.
  router.post(
    "/:id/archive",
    requireModerator,
    asyncHandler(async (req, res) => {
      assertStatus(req.post, "APPROVED", "archived");
      respond(req, res, await updatePost(req.post.id, { topicSlug: "archive", locked: true }));
    }),
  );

  return router;
}
