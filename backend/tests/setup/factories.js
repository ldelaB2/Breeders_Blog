import { prisma } from "./harness.js";

// Seed helpers: each writes rows straight to the test database and returns
// what it created. Only the fields a test cares about need passing.

let seq = 0;
const next = () => ++seq;

export function createUser({ id = `user_${next()}`, role = "USER", name = "Test User", email } = {}) {
  return prisma.user.create({ data: { id, role, name, email: email ?? `${id}@example.com` } });
}

export function createPost({
  author,
  id = `post_${next()}`,
  status = "APPROVED",
  topicSlug = "qg",
  title = `Post ${id}`,
  abstract = "An abstract.",
  locked = false,
  htmlSlug = status === "APPROVED" ? `${id}.html` : null,
  rawSlug = `${id}/upload.md`,
  rawOriginalName = "post.md",
  imageSlug = null,
  viewCount = 0,
  createdAt,
} = {}) {
  return prisma.postMetadata.create({
    data: {
      id,
      status,
      topicSlug,
      title,
      abstract,
      locked,
      viewCount,
      authorId: author.id,
      authorName: author.name,
      ...(createdAt && { createdAt }),
      body: { create: { rawSlug, rawOriginalName, htmlSlug, imageSlug } },
    },
  });
}

export function createComment({ post, author, text = "A comment.", parentId = null, deletedAt = null, createdAt }) {
  return prisma.comment.create({
    data: {
      postId: post.id,
      authorId: author.id,
      authorName: author.name,
      text,
      parentId,
      deletedAt,
      ...(createdAt && { createdAt }),
    },
  });
}

export const vote = (post, user, value) => prisma.vote.create({ data: { postId: post.id, userId: user.id, value } });
export const pin = (post, user, createdAt) =>
  prisma.pin.create({ data: { postId: post.id, userId: user.id, ...(createdAt && { createdAt }) } });
export const link = (source, target) =>
  prisma.postLink.create({ data: { sourcePostId: source.id, targetPostId: target.id } });

// Dates n minutes in the past, for ordering tests.
export const minutesAgo = (n) => new Date(Date.now() - n * 60_000);
