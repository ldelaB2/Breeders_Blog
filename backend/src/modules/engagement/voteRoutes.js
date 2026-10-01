import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { toggleVote } from "./toggles.js";

// Registers POST /:id/upvote and /:id/downvote on `router` for any votable
// record (posts, comments):
//   guards       middleware to run first (auth, status checks)
//   delegate()   the Prisma model holding the votes, e.g. () => prisma.vote
//   keyFor(req)  the compound unique for the caller's vote on req's record
//   respond(req) the freshly re-read record, serialized for the response
export function voteRoutes(router, { guards, delegate, keyFor, respond }) {
  for (const [action, value] of [
    ["upvote", 1],
    ["downvote", -1],
  ]) {
    router.post(
      `/:id/${action}`,
      ...guards,
      asyncHandler(async (req, res) => {
        await toggleVote(delegate(), keyFor(req), value);
        res.json(await respond(req));
      }),
    );
  }
}
