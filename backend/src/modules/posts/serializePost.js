import { ownsOrModerates } from "../users/roles.js";
import { serializeVotes } from "../engagement/serializeVotes.js";
import { slugify } from "./postUrl.js";
import { imageUrlFor } from "./posts.repo.js";

// Shapes a post row (loaded with postInclude) into the flat object the
// frontend expects. `viewer` is req.user (undefined when anonymous).
// Moderation detail is only included for the post's author or a
// moderator/admin. The raw upload is never serialized - an admin gets it via
// GET /posts/:id/download.
export function serializePost(post, viewer, opts = {}) {
  return {
    id: post.id,
    topicSlug: post.topicSlug,
    title: post.title,
    slug: slugify(post.title),
    abstract: post.abstract,
    status: post.status,
    locked: post.locked,
    authorId: post.authorId,
    authorName: post.authorName,
    authorAvatarUrl: post.authorAvatarUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    htmlSlug: post.body?.htmlSlug ?? null,
    imageUrl: imageUrlFor(post.body?.imageSlug),
    commentCount: post._count?.comments ?? undefined,
    linkedPostCount: post._count?.linksFrom ?? undefined,
    viewCount: post.viewCount,
    ...serializeVotes(post.votes),
    pinnedBy: post.pins.map((p) => p.userId),
    ...(opts.html !== undefined && { html: opts.html }),
    ...(ownsOrModerates(viewer, post.authorId) && {
      reviewedById: post.reviewedById,
      reviewedAt: post.reviewedAt,
      rejectionReason: post.rejectionReason,
    }),
  };
}

export const serializePosts = (posts, viewer) => posts.map((p) => serializePost(p, viewer));
