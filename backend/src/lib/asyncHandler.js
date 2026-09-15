// Express 4 does not catch rejected promises thrown by async route
// handlers - an uncaught rejection there crashes the whole process
// (verified: any request that throws inside an unwrapped async handler
// takes the entire server down, not just that request). Wrapping every
// handler in this forwards the error to Express's error middleware instead.
export const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);
