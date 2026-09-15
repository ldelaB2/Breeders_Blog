// Home page "Recommended for You" logic - kept in its own module, separate
// from the route that calls it, so the suggestion strategy can be swapped
// or tuned later without touching request handling.
//
// v1 strategy: find the topics the user has engaged with (voted, commented
// on, or pinned), then recommend that user's highest-ranked unseen posts in
// those topics. Backfills with global top posts when there isn't enough
// topic-affinity signal (e.g. a brand-new account).
import { prisma } from "./prisma.js";
import { postInclude as include } from "./postInclude.js";
import { serializePost } from "./serializePost.js";
import { rankScore } from "./rankScore.js";

async function engagedTopicsAndPostIds(userId) {
  const [votes, pins, comments] = await Promise.all([
    prisma.vote.findMany({ where: { userId }, select: { postId: true } }),
    prisma.pin.findMany({ where: { userId }, select: { postId: true } }),
    prisma.comment.findMany({ where: { authorId: userId }, select: { postId: true } }),
  ]);

  const postIds = new Set([...votes, ...pins, ...comments].map((row) => row.postId));
  if (postIds.size === 0) return { topics: new Set(), postIds };

  const posts = await prisma.postMetadata.findMany({
    where: { id: { in: [...postIds] } },
    select: { topicSlug: true },
  });
  return { topics: new Set(posts.map((p) => p.topicSlug)), postIds };
}

function rankedApprovedPosts(posts, viewer) {
  return posts
    .map((p) => serializePost(p, viewer))
    .sort((a, b) => rankScore(b) - rankScore(a));
}

export async function getRecommendedPosts({ userId, userRole, limit = 6 }) {
  const viewer = { userId, userRole };
  const { topics, postIds } = await engagedTopicsAndPostIds(userId);

  const fromTopics = topics.size
    ? rankedApprovedPosts(
        await prisma.postMetadata.findMany({
          where: { status: "APPROVED", topicSlug: { in: [...topics] }, id: { notIn: [...postIds] } },
          include,
        }),
        viewer
      )
    : [];

  const recommendations = fromTopics.slice(0, limit);
  if (recommendations.length >= limit) return recommendations;

  // Backfill with global top posts, excluding anything already interacted
  // with or already picked above.
  const excluded = new Set([...postIds, ...recommendations.map((p) => p.id)]);
  const backfill = rankedApprovedPosts(
    await prisma.postMetadata.findMany({
      where: { status: "APPROVED", id: { notIn: [...excluded] } },
      include,
    }),
    viewer
  );

  return [...recommendations, ...backfill].slice(0, limit);
}
