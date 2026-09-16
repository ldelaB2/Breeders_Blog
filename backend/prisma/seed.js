// Loads app/sample_post/{posts,comments}.json into the database, reshaped
// to fit the current schema: posts are inserted as already-APPROVED (with
// a seed moderator as reviewer), each post's flat `voteScore`/comment
// `voteScore` is reconstructed as real per-user Vote/CommentVote rows (one
// synthetic voter pool reused across posts/comments, since the uniqueness
// constraint is per (postId, userId) / (commentId, userId), not global),
// and the sample `body` HTML is both checked into backend/seed-html/ (for
// version control) and uploaded to the html store under the same slug that
// PostBody.htmlSlug points at (see src/lib/htmlStore.js), so seeded posts
// actually have retrievable content. Safe to re-run: it clears prior seeded
// posts first.
import { PrismaClient } from "@prisma/client";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { saveStitchedHtml } from "../src/lib/htmlStore.js";

const prisma = new PrismaClient();
const SAMPLE_DIR = path.resolve(import.meta.dirname, "../../app/sample_post");
const HTML_STORE_DIR = path.resolve(import.meta.dirname, "../seed-html");

function slug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function ensureUser(id, name, role = "USER") {
  return prisma.user.upsert({ where: { id }, update: { name, role }, create: { id, name, role } });
}

const authorCache = new Map();
async function ensureAuthor(name) {
  if (!authorCache.has(name)) {
    authorCache.set(name, await ensureUser(`author_${slug(name)}`, name));
  }
  return authorCache.get(name);
}

const voterCache = new Map();
async function ensureVoter(n) {
  if (!voterCache.has(n)) {
    voterCache.set(n, await ensureUser(`voter_${n}`, `Seed Voter ${n}`));
  }
  return voterCache.get(n);
}

async function castVotes({ score, cast }) {
  const value = score >= 0 ? 1 : -1;
  for (let i = 1; i <= Math.abs(score); i++) {
    const voter = await ensureVoter(i);
    await cast(voter.id, value);
  }
}

// Hand-written "raw markdown" stand-ins for the six sample posts - what an
// author would plausibly have submitted before a moderator stitched it into
// the sample data's `body` HTML (the chart included).
const RAW_MD_BY_POST_ID = {
  1: "## Overview\n\nGenomic selection accuracy drops sharply below a certain reference population size.\n\n[chart: prediction accuracy by training population size]",
  2: "## Trait Comparison\n\nFertility traits show consistently lower heritability than growth traits.\n\n[chart: heritability by trait]",
  3: "## Model Loss\n\nValidation loss plateaus after roughly 40 epochs.\n\n[chart: validation loss curve]",
  4: "## Sparsity Pattern\n\nThe coefficient matrix is over 95% sparse for typical pedigree sizes.\n\n[chart: sparsity by matrix block]",
  5: "## NDVI Distribution\n\nMost flagged sections recovered within two weeks of irrigation adjustment.\n\n[chart: NDVI recovery time distribution]",
  6: "## Long-Term Trend\n\nThe heuristic still holds but with a wider confidence interval than originally reported.\n\n[chart: culling rate trend, 2015-2025]",
};

async function main() {
  const posts = JSON.parse(await readFile(path.join(SAMPLE_DIR, "posts.json"), "utf8"));
  const comments = JSON.parse(await readFile(path.join(SAMPLE_DIR, "comments.json"), "utf8"));

  await mkdir(HTML_STORE_DIR, { recursive: true });
  await prisma.postMetadata.deleteMany({}); // cascades to PostBody/Vote/Pin/Comment/CommentVote

  const moderator = await ensureUser("seed_moderator", "Blog Moderator", "MODERATOR");

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const postIdMap = new Map();

  for (const p of posts) {
    const author = await ensureAuthor(p.author);
    const createdAt = new Date(now - (posts.length - p.id) * DAY);
    const htmlSlug = `post-${p.id}.html`;
    await writeFile(path.join(HTML_STORE_DIR, htmlSlug), p.body, "utf8");
    await saveStitchedHtml(htmlSlug, p.body);

    const post = await prisma.postMetadata.create({
      data: {
        topicSlug: p.topic,
        title: p.title,
        abstract: p.abstract,
        status: "APPROVED",
        authorId: author.id,
        authorName: author.name,
        reviewedById: moderator.id,
        reviewedAt: createdAt,
        createdAt,
        updatedAt: createdAt,
        body: {
          create: {
            rawMd: RAW_MD_BY_POST_ID[p.id] ?? p.abstract,
            htmlSlug,
            htmlUpdatedAt: createdAt,
          },
        },
      },
    });
    postIdMap.set(p.id, post.id);

    await castVotes({
      score: p.voteScore,
      cast: (userId, value) => prisma.vote.create({ data: { postId: post.id, userId, value } }),
    });

    if (p.pinned) {
      await prisma.pin.create({ data: { postId: post.id, userId: author.id } });
    }
  }

  const HOUR = 60 * 60 * 1000;
  const commentIdMap = new Map();

  // comments.json lists parents before children (by comment_id), so a
  // single ascending pass always resolves parentId before it's needed.
  for (const c of comments) {
    const author = await ensureAuthor(c.author);
    const postId = postIdMap.get(c.post_id);
    const parentId = c.parent_comment_id === -1 ? null : commentIdMap.get(c.parent_comment_id);
    const createdAt = new Date(now - (comments.length - c.comment_id) * HOUR);

    const comment = await prisma.comment.create({
      data: { postId, parentId, authorId: author.id, authorName: author.name, text: c.text, createdAt },
    });
    commentIdMap.set(c.comment_id, comment.id);

    await castVotes({
      score: c.voteScore,
      cast: (userId, value) => prisma.commentVote.create({ data: { commentId: comment.id, userId, value } }),
    });
  }

  console.log(`Seeded ${posts.length} posts and ${comments.length} comments.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
