// Thrown from a route to send a specific status and message; the error
// handler in app.js turns it into { error: message }. Anything else that's
// thrown is a genuine 500 and its message is never sent to the client.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Validates a JSON body field that must be a non-empty string. Fields
// arrive as arbitrary JSON, so a caller can send an object/array in place
// of a string - this stops that ever reaching a Prisma write.
export function requireText(value, field, maxLength) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new HttpError(400, `${field} is required`);
  if (text.length > maxLength) throw new HttpError(400, `${field} must be ${maxLength} characters or fewer`);
  return text;
}
