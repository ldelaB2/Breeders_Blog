import { HttpError } from "./httpError.js";

// Request bodies and query strings arrive as arbitrary JSON / parsed query
// objects - a caller can send an object or array where a string belongs
// (?topicSlug[not]=x becomes { not: "x" }, which Prisma would treat as a
// filter operator). These checks stop that before it reaches a query.

// A required, non-empty string field, trimmed.
export function requireText(value, field, maxLength) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new HttpError(400, `${field} is required`);
  if (text.length > maxLength) throw new HttpError(400, `${field} must be ${maxLength} characters or fewer`);
  return text;
}

// An optional string field: undefined when absent, a 400 if it isn't a string.
export function optionalString(value, field) {
  if (value !== undefined && typeof value !== "string") throw new HttpError(400, `${field} must be a string`);
  return value;
}

// A `?limit=` query value: `fallback` when missing or invalid, capped at `max`.
export function parseLimit(value, { fallback, max }) {
  return Math.min(Number(value) || fallback, max);
}
