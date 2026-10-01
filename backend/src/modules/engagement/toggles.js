import { ignoreConflicts } from "../../lib/db/prismaErrors.js";

// Per-user toggles keyed by a compound unique, e.g.
// { postId_userId: { postId, userId } }. Shared by posts and comments
// (prisma.vote / prisma.commentVote, prisma.pin). Each is a read-then-write,
// so overlapping clicks can race; ignoreConflicts lets the loser no-op.

// Same vote again removes it, the opposite vote switches it, no vote adds
// it - the frontend's applyVoteToggle() predicts exactly this.
export async function toggleVote(model, where, value) {
  const existing = await model.findUnique({ where });
  if (existing?.value === value) return ignoreConflicts(model.delete({ where }));
  if (existing) return ignoreConflicts(model.update({ where, data: { value } }));
  return ignoreConflicts(model.create({ data: { ...Object.values(where)[0], value } }));
}

// Adds the row if it's missing, removes it if present (pins).
export async function toggleMembership(model, where) {
  const existing = await model.findUnique({ where });
  if (existing) return ignoreConflicts(model.delete({ where }));
  return ignoreConflicts(model.create({ data: Object.values(where)[0] }));
}
