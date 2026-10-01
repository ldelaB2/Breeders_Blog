import { prisma } from "../../lib/db/prisma.js";
import { escapeHtml } from "../../lib/mail/createMailer.js";
import { env } from "../../config/env.js";
import { postUrl } from "../posts/postUrl.js";

// The post-workflow emails, sent through the injected mailer (deps.mailer),
// which logs rather than throws on failure.
export function createNotifications(mailer) {
  // Sends to the post's author, if they have an email on file.
  async function emailAuthor(post, subject, html) {
    const author = await prisma.user.findUnique({ where: { id: post.authorId }, select: { email: true } });
    if (author?.email) await mailer.send(author.email, subject, html);
  }

  return {
    async notifyAdminsOfPendingPost(post) {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", email: { not: null } },
        select: { email: true },
      });
      await mailer.send(
        admins.map((a) => a.email),
        `New post pending review: ${post.title}`,
        `<p>${escapeHtml(post.authorName)} submitted a new post to Breeders Blog:</p>
     <p><strong>${escapeHtml(post.title)}</strong></p>
     <p>${escapeHtml(post.abstract)}</p>
     <p><a href="${env.siteUrl}/admin">Review it in the admin queue</a></p>`,
      );
    },

    notifyAuthorOfApproval: (post) =>
      emailAuthor(
        post,
        `Your post "${post.title}" was approved`,
        `<p>Your post <strong>${escapeHtml(post.title)}</strong> to Breeders Blog was approved! Thanks for adding to the discussion.</p>
     <p><a href="${postUrl(post)}">View your post</a></p>`,
      ),

    notifyAuthorOfRejection: (post) =>
      emailAuthor(
        post,
        `Your post "${post.title}" was not approved`,
        `<p>Sorry, but your post <strong>${escapeHtml(post.title)}</strong> to Breeders Blog was rejected for the following reason:</p>
     <blockquote>${escapeHtml(post.rejectionReason)}</blockquote>
     <p>Please update your post and re-submit.</p>`,
      ),
  };
}
