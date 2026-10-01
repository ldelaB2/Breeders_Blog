// Prisma error codes for a write that lost a race: P2002 = unique constraint
// (the row was just created), P2025 = record not found (it was just deleted).
const RACE_CODES = ["P2002", "P2025"];

// Awaits a write, swallowing the race errors in `codes`. Two overlapping
// toggles (a burst of rapid clicks) can collide on a read-then-write;
// whichever won already left the data in a valid state and the caller
// re-reads for its response, so the loser just no-ops instead of 500ing.
export async function ignoreConflicts(write, codes = RACE_CODES) {
  try {
    return await write;
  } catch (err) {
    if (!codes.includes(err.code)) throw err;
  }
}
