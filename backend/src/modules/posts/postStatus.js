import { HttpError } from "../../lib/http/httpError.js";

// A state-changing action that only applies in one status, e.g.
// assertStatus(req.post, "PENDING", "approved") -> 400 "Only pending posts
// can be approved".
export function assertStatus(post, status, action) {
  if (post.status !== status) throw new HttpError(400, `Only ${status.toLowerCase()} posts can be ${action}`);
}

// Middleware for reader actions (votes, pins) on req.post: an unapproved
// post is treated as not existing at all.
export function requireApproved(req, res, next) {
  next(req.post.status === "APPROVED" ? undefined : new HttpError(404, "Post not found"));
}
