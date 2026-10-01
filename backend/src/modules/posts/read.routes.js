import { Router } from "express";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { HttpError } from "../../lib/http/httpError.js";
import { ownsOrModerates } from "../users/roles.js";
import { loadPostParam } from "./posts.repo.js";
import { serializePost } from "./serializePost.js";

// A single post page. Mounted last in posts/index.js: "/:id" would otherwise
// swallow static paths like "/pending".
export function readRoutes({ auth, stores }) {
  const router = Router();
  loadPostParam(router);

  router.get(
    "/:id",
    auth.optionalAuth,
    asyncHandler(async (req, res) => {
      const { post } = req;
      if (post.status !== "APPROVED" && !ownsOrModerates(req.user, post.authorId)) {
        throw new HttpError(404, "Post not found");
      }
      // Only this route pulls the HTML out of storage - list views never do.
      // ?html=0 skips it too: the frontend's api/post.js only needs the
      // metadata to fill a post page's <head>.
      const html = req.query.html === "0" ? undefined : await stores.html.text(post.body?.htmlSlug);
      res.json(serializePost(post, req.user, { html }));
    }),
  );

  return router;
}
