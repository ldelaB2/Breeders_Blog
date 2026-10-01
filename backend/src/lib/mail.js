// Post-workflow notification emails via Resend. A send failure must never
// break the request that triggered it (the approval/rejection/submission
// already succeeded in the DB), so every failure is logged rather than thrown.
import { prisma } from "./prisma.js";
import { postUrl } from "./postUrl.js";
import { escapeHtml } from "./mail/createMailer.js";

export function createNotifications({ send }) {
  const SITE_URL = process.env.SITE_URL;

  async function notifyAdminsOfPendingPost(post) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", email: { not: null } },
      select: { email: true },
    });

    const title = escapeHtml(post.title);
    await send(
      admins.map((a) => a.email),
      `New post pending review: ${post.title}`,
      `<p>${escapeHtml(post.authorName)} submitted a new post to Breeders Blog:</p>
       <p><strong>${title}</strong></p>
       <p>${escapeHtml(post.abstract)}</p>
       <p><a href="${SITE_URL}/admin">Review it in the admin queue</a></p>`
    );
  }

  async function notifyAuthorOfApproval(post) {
    const author = await prisma.user.findUnique({ where: { id: post.authorId }, select: { email: true } });
    if (!author?.email) return;

    const title = escapeHtml(post.title);
    await send(
      author.email,
      `Your post "${post.title}" was approved`,
      `<p>Your post <strong>${title}</strong> to Breeders Blog was approved! Thanks for adding to the discussion.</p>
       <p><a href="${postUrl(post)}">View your post</a></p>`
    );
  }

  async function notifyAuthorOfRejection(post) {
    const author = await prisma.user.findUnique({ where: { id: post.authorId }, select: { email: true } });
    if (!author?.email) return;

    const title = escapeHtml(post.title);
    await send(
      author.email,
      `Your post "${post.title}" was not approved`,
      `<p>Sorry, but your post <strong>${title}</strong> to Breeders Blog was rejected for the following reason:</p>
       <blockquote>${escapeHtml(post.rejectionReason)}</blockquote>
       <p>Please update your post and re-submit.</p>`
    );
  }

  return { notifyAdminsOfPendingPost, notifyAuthorOfApproval, notifyAuthorOfRejection };
}
