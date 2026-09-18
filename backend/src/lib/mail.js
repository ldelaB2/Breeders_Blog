// Post-workflow notification emails via Resend. A send failure must never
// break the request that triggered it (the approval/rejection/submission
// already succeeded in the DB), so every failure is logged rather than thrown.
import { Resend } from "resend";
import { prisma } from "./prisma.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Breeders Blog <onboarding@resend.dev>";
const SITE_URL = process.env.SITE_URL;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function send(to, subject, html) {
  if (!to || (Array.isArray(to) && to.length === 0)) return;
  try {
    // The SDK resolves with { data, error } rather than throwing on
    // API-level failures (e.g. the sandbox "from" address's restriction to
    // only send to the Resend account's own email) - both paths need to be
    // logged, or a rejected send fails silently.
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("Resend rejected notification email:", error);
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}

export async function notifyAdminsOfPendingPost(post) {
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

export async function notifyAuthorOfApproval(post) {
  const author = await prisma.user.findUnique({ where: { id: post.authorId }, select: { email: true } });
  if (!author?.email) return;

  const title = escapeHtml(post.title);
  await send(
    author.email,
    `Your post "${post.title}" was approved`,
    `<p>Your post <strong>${title}</strong> to Breeders Blog was approved! Thanks for adding to the discussion.</p>
     <p><a href="${SITE_URL}/posts/${post.id}">View your post</a></p>`
  );
}

export async function notifyAuthorOfRejection(post) {
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
