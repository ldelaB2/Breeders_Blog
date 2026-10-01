import { prisma } from "../../lib/db/prisma.js";
import { env } from "../../config/env.js";
import { IMAGE_TYPES } from "../../config/limits.js";
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

// A filename's lowercased extension, or null. Only ever used to pick from a
// fixed list of types - never to build a path.
export function extensionOf(filename) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(typeof filename === "string" ? filename : "");
  return match ? match[1].toLowerCase() : null;
}

// Storage object names. The client's own filename never reaches a path.
export const htmlSlugFor = (postId) => `${postId}.html`;
export const rawSlugFor = (postId, ext) => `${postId}/upload.${ext}`;
export const imageSlugFor = (postId, ext) => `${postId}/share.${ext}`;

// Whether `slug` is a share-image name this post could own - lets a route
// accept an imageSlug from the client without it pointing anywhere else.
export const isImageSlugFor = (postId, slug) =>
  Object.keys(IMAGE_TYPES).some((ext) => slug === imageSlugFor(postId, ext));

// The post-image bucket is public: link-preview scrapers fetch og:image
// anonymously and cache it for days, so a signed URL would expire under
// them. Unguessable post ids keep pending posts' images effectively private.
export const imageUrlFor = (slug) =>
  slug ? `${env.supabaseUrl}/storage/v1/object/public/${env.imageBucket}/${slug}` : null;
