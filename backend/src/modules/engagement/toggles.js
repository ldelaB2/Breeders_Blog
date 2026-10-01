import { ignoreConflicts } from "../../lib/db/prismaErrors.js";

// Per-user toggles keyed by a compound unique, e.g.
// { postId_userId: { postId, userId } }. Shared by posts and comments
// (prisma.vote / prisma.commentVote, prisma.pin). Each is a read-then-write,
// so overlapping clicks can race; ignoreConflicts lets the loser no-op.

// Same vote again removes it, the opposite vote switches it, no vote adds
// it - the frontend's applyVoteToggle() predicts exactly this.
export async function toggleVote(delegate, where, value) {
  const existing = await delegate.findUnique({ where });
  if (existing?.value === value) return ignoreConflicts(delegate.delete({ where }));
  if (existing) return ignoreConflicts(delegate.update({ where, data: { value } }));
  return ignoreConflicts(delegate.create({ data: { ...Object.values(where)[0], value } }));
}

// Adds the row if it's missing, removes it if present (pins).
export async function toggleMembership(delegate, where) {
  const existing = await delegate.findUnique({ where });
  if (existing) return ignoreConflicts(delegate.delete({ where }));
  return ignoreConflicts(delegate.create({ data: Object.values(where)[0] }));
}
