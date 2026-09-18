// Shapes a PostMetadata row (with votes/pins/body/_count relations loaded)
// into the flat object the frontend expects. Moderation detail is only
// included for the post's author or a moderator/admin - everyone else only
// ever sees the stitched HTML pointer once a post is approved. The raw
// upload itself is never serialized here - a moderator gets it via
// GET /:id/download instead.
export function serializePost(post, viewer = {}, opts = {}) {
  const { userId, userRole } = viewer;
  const isModerator = userRole === "MODERATOR" || userRole === "ADMIN";
  const canSeeReviewDetail = isModerator || userId === post.authorId;

  return {
    id: post.id,
    topicSlug: post.topicSlug,
    title: post.title,
    abstract: post.abstract,
    status: post.status,
    locked: post.locked,
    authorId: post.authorId,
    authorName: post.authorName,
    authorAvatarUrl: post.authorAvatarUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    htmlSlug: post.body?.htmlSlug ?? null,
    commentCount: post._count?.comments ?? undefined,
    upvotes: post.votes.filter((v) => v.value === 1).map((v) => v.userId),
    downvotes: post.votes.filter((v) => v.value === -1).map((v) => v.userId),
    pinnedBy: post.pins.map((p) => p.userId),
    ...(opts.html !== undefined && { html: opts.html }),
    ...(canSeeReviewDetail && {
      reviewedById: post.reviewedById,
      reviewedAt: post.reviewedAt,
      rejectionReason: post.rejectionReason,
    }),
  };
}
