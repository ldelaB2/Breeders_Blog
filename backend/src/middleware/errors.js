import { HttpError } from "../lib/http/httpError.js";

// Mounted last in app.js: anything no route matched.
export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

// An HttpError carries a status and a client-safe message, as does a 4xx
// marked `expose` (the http-errors convention express.json() uses for
// malformed or oversized bodies); anything else is a 500 and only ever logged.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError || (err.expose && err.status < 500)) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
