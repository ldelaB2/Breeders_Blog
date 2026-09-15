import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Fetches/stores the moderator-stitched HTML in Cloudflare R2 by its key
// (PostBody.htmlSlug). R2 exposes an S3-compatible API, so the regular AWS
// SDK works against it with just a custom endpoint.
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const Bucket = process.env.R2_BUCKET_NAME;

export async function getStitchedHtml(htmlSlug) {
  if (!htmlSlug) return null;
  try {
    const { Body } = await client.send(new GetObjectCommand({ Bucket, Key: htmlSlug }));
    return await Body.transformToString("utf8");
  } catch {
    return null;
  }
}

export async function saveStitchedHtml(htmlSlug, html) {
  await client.send(
    new PutObjectCommand({ Bucket, Key: htmlSlug, Body: html, ContentType: "text/html" })
  );
}

export async function deleteStitchedHtml(htmlSlug) {
  if (!htmlSlug) return;
  await client.send(new DeleteObjectCommand({ Bucket, Key: htmlSlug }));
}
