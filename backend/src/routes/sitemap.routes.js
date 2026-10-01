import { Router } from "express";
import { prisma } from "../lib/db/prisma.js";
import { asyncHandler } from "../lib/http/asyncHandler.js";
import { TOPIC_SLUGS } from "../config/topics.js";
import { postUrl } from "../modules/posts/postUrl.js";
import { env } from "../config/env.js";

const router = Router();

// The frontend's public pages plus every approved post's permalink, so
// search engines can find them all. Served on the site's own domain via a
// rewrite in app/vercel.json and referenced from app/public/robots.txt.
const STATIC_PATHS = ["/", "/about", "/contact", ...TOPIC_SLUGS.map((slug) => `/topics/${slug}`)];

router.get(
  "/sitemap.xml",
  asyncHandler(async (req, res) => {
    const posts = await prisma.postMetadata.findMany({
      where: { status: "APPROVED" },
      select: { id: true, title: true, updatedAt: true },
    });
    const urls = [
      ...STATIC_PATHS.map((path) => `<url><loc>${env.siteUrl}${path}</loc></url>`),
      ...posts.map((p) => `<url><loc>${postUrl(p)}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`),
    ].join("");
    res
      .type("application/xml")
      .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  })
);

export default router;
