import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

// Stand-in for fetching/storing the moderator-stitched HTML in S3 by its
// key. PostBody.htmlSlug is already shaped like an S3 object key, so
// swapping these for real S3 GetObject/PutObject calls is a one-function
// change once a bucket exists - nothing calling this needs to know the
// difference.
const STORE_ROOT = path.resolve(import.meta.dirname, "../../seed-html");

export async function getStitchedHtml(htmlSlug) {
  if (!htmlSlug) return null;
  try {
    return await readFile(path.join(STORE_ROOT, htmlSlug), "utf8");
  } catch {
    return null;
  }
}

export async function saveStitchedHtml(htmlSlug, html) {
  await mkdir(STORE_ROOT, { recursive: true });
  await writeFile(path.join(STORE_ROOT, htmlSlug), html, "utf8");
}

export async function deleteStitchedHtml(htmlSlug) {
  if (!htmlSlug) return;
  await rm(path.join(STORE_ROOT, htmlSlug), { force: true });
}
