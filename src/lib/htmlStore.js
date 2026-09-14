import { readFile } from "node:fs/promises";
import path from "node:path";

// Stand-in for fetching the moderator-stitched HTML from S3 by its key.
// PostBody.htmlSlug is already shaped like an S3 object key, so swapping
// this for a real S3 GetObject call is a one-function change once a
// bucket exists - nothing calling this needs to know the difference.
const STORE_ROOT = path.resolve(import.meta.dirname, "../../seed-html");

export async function getStitchedHtml(htmlSlug) {
  if (!htmlSlug) return null;
  try {
    return await readFile(path.join(STORE_ROOT, htmlSlug), "utf8");
  } catch {
    return null;
  }
}
