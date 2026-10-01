import { prisma } from "../../lib/db/prisma.js";
import { loadResource } from "../../middleware/loadResource.js";

// Every post query loads the same relations - everything serializePost()
// needs. Routes outside this module (pins, recommendations, links) use it
// too, so posts always serialize the same way.
export const postInclude = {
  votes: true,
  pins: true,
  body: true,
  _count: { select: { comments: { where: { deletedAt: null } }, linksFrom: true } },
};

export const findPost = (id) => prisma.postMetadata.findUnique({ where: { id }, include: postInclude });

export const listPosts = (where, orderBy) => prisma.postMetadata.findMany({ where, orderBy, include: postInclude });

export const updatePost = (id, data) => prisma.postMetadata.update({ where: { id }, data, include: postInclude });

// Every "/:id" route on `router` gets the post loaded as req.post, or a 404.
export const loadPostParam = (router) =>
  loadResource(router, "id", { find: findPost, as: "post", notFound: "Post not found" });

// Storage object names. The client's own filename never reaches a path.
export const htmlSlugFor = (postId) => `${postId}.html`;
export const rawSlugFor = (postId, ext) => `${postId}/upload.${ext}`;
