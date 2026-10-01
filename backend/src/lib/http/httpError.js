// Thrown from a route or middleware to send a specific status and message;
// the error handler (middleware/errors.js) turns it into { error: message }.
// Anything else that's thrown is a genuine 500 and its message is never sent
// to the client.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
