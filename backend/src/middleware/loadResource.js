import { asyncHandler } from "../lib/http/asyncHandler.js";
import { HttpError } from "../lib/http/httpError.js";

// Makes every route on `router` with a `:param` segment load that record
// first: `find(value)` runs once per request, the result is stored on
// req[as], and a missing record is a 404 with `notFound` as the message.
//
//   loadResource(router, "id", { find: findPost, as: "post", notFound: "Post not found" });
export function loadResource(router, param, { find, as, notFound }) {
  router.param(
    param,
    asyncHandler(async (req, res, next, value) => {
      req[as] = await find(value);
      if (!req[as]) throw new HttpError(404, notFound);
      next();
    }),
  );
}
