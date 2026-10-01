import { Resend } from "resend";

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Sends notification emails via Resend. A send failure must never break the
// request that triggered it (the approval/rejection/submission already
// succeeded in the DB), so every failure is logged rather than thrown. The
// recording fake in tests/setup/fakes.js implements the same send().
export function createMailer({ apiKey, from }) {
  let resend;

  return {
    async send(to, subject, html) {
      if (!to || (Array.isArray(to) && to.length === 0)) return;
      try {
        resend ??= new Resend(apiKey);
        // The SDK resolves with { data, error } rather than throwing on
        // API-level failures (e.g. the sandbox "from" address's restriction
        // to only send to the Resend account's own email) - both paths need
        // to be logged, or a rejected send fails silently.
        const { error } = await resend.emails.send({ from, to, subject, html });
        if (error) console.error("Resend rejected notification email:", error);
      } catch (err) {
        console.error("Failed to send notification email:", err);
      }
    },
  };
}
