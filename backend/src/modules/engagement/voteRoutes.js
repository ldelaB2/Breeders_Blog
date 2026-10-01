import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { toggleVote } from "./toggles.js";

// Registers POST <path>/upvote and <path>/downvote on `router` for any
// votable record (posts, comments):
//   path         the record's route, "/:id" by default
//   guards       middleware to run first (auth, status checks)
//   model        the Prisma model holding the votes, e.g. prisma.vote
//   keyFor(req)  the compound unique for the caller's vote on req's record
//   respond(req) the freshly re-read record, serialized for the response
export function voteRoutes(router, { path = "/:id", guards, model, keyFor, respond }) {
  for (const [action, value] of [
    ["upvote", 1],
    ["downvote", -1],
  ]) {
    router.post(
      `${path}/${action}`,
      ...guards,
      asyncHandler(async (req, res) => {
        await toggleVote(model, keyFor(req), value);
        res.json(await respond(req));
      }),
    );
  }
}
