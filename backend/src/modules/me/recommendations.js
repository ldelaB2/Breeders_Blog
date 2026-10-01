// Home page "Recommended for You" logic - kept in its own module, separate
// from the route that calls it, so the suggestion strategy can be swapped
// or tuned later without touching request handling.
//
// Strategy: start from the posts the user engaged with positively (pinned,
// upvoted, or commented on), then fill the list in three tiers, never
// repeating a post or suggesting one the user already interacted with
// (including downvoted ones):
//   1. Posts those engaged posts link to (see PostLink), the ones linked
//      from the most engaged posts first, ties broken by rank score.
//   2. The highest-ranked posts in the engaged posts' topics.
//   3. Global top posts, for when there isn't enough signal (e.g. a
//      brand-new account).
import { prisma } from "../../lib/db/prisma.js";
import { listPosts } from "../posts/posts.repo.js";
import { rankPosts, rankScore } from "../posts/ranking.js";

// `liked`: post ids the user pinned, upvoted or commented on.
// `seen`: every post id the user interacted with, downvotes included.
async function engagedPostIds(userId) {
  const [votes, pins, comments] = await Promise.all([
    prisma.vote.findMany({ where: { userId }, select: { postId: true, value: true } }),
    prisma.pin.findMany({ where: { userId }, select: { postId: true } }),
    prisma.comment.findMany({ where: { authorId: userId, deletedAt: null }, select: { postId: true } }),
  ]);

  const upvotes = votes.filter((v) => v.value > 0);
  const liked = new Set([...upvotes, ...pins, ...comments].map((row) => row.postId));
  const seen = new Set([...liked, ...votes.map((v) => v.postId)]);
  return { liked, seen };
}

// Approved posts linked from any of `liked`, excluding `excluded`, most
// linked-to first.
async function linkedPosts(liked, excluded, user) {
  const links = await prisma.postLink.findMany({
    where: {
      sourcePostId: { in: [...liked] },
      targetPostId: { notIn: [...excluded] },
      targetPost: { status: "APPROVED" },
    },
    select: { targetPostId: true },
  });

  const linkCount = new Map();
  for (const { targetPostId } of links) linkCount.set(targetPostId, (linkCount.get(targetPostId) ?? 0) + 1);
  if (linkCount.size === 0) return [];

  const posts = rankPosts(await listPosts({ id: { in: [...linkCount.keys()] } }), user);
  return posts.sort((a, b) => linkCount.get(b.id) - linkCount.get(a.id) || rankScore(b) - rankScore(a));
}

async function topicsOf(postIds) {
  const posts = await prisma.postMetadata.findMany({ where: { id: { in: [...postIds] } }, select: { topicSlug: true } });
  return new Set(posts.map((p) => p.topicSlug));
}

export async function getRecommendedPosts({ user, limit }) {
  const { liked, seen } = await engagedPostIds(user.id);
  const picked = [];
  const excluded = () => new Set([...seen, ...picked.map((p) => p.id)]);

  if (liked.size) picked.push(...(await linkedPosts(liked, excluded(), user)).slice(0, limit));
  if (picked.length >= limit) return picked;

  const topics = liked.size ? await topicsOf(liked) : new Set();
  if (topics.size) {
    const fromTopics = rankPosts(
      await listPosts({ status: "APPROVED", topicSlug: { in: [...topics] }, id: { notIn: [...excluded()] } }),
      user,
    );
    picked.push(...fromTopics.slice(0, limit - picked.length));
    if (picked.length >= limit) return picked;
  }

  const backfill = rankPosts(await listPosts({ status: "APPROVED", id: { notIn: [...excluded()] } }), user);
  return [...picked, ...backfill].slice(0, limit);
}
