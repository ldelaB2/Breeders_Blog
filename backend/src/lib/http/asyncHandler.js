// Express 4 doesn't catch rejected promises from async handlers - an
// unhandled rejection takes the whole process down. Wrapping every handler
// (and router.param callback) forwards the error to the error middleware.
export const asyncHandler = (fn) => (req, res, next, ...rest) => fn(req, res, next, ...rest).catch(next);
