import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const router = Router();
const SITE_URL = process.env.SITE_URL || "http://localhost:5173";

// Lists every approved post's permalink so search engines have something to
// discover and index - posts otherwise have no other path to being found,
// since nothing else links to them by URL.
router.get(
  "/sitemap.xml",
  asyncHandler(async (req, res) => {
    const posts = await prisma.postMetadata.findMany({
      where: { status: "APPROVED" },
      select: { id: true, updatedAt: true },
    });

    const urls = posts
      .map(
        (p) =>
          `<url><loc>${SITE_URL}/posts/${p.id}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`
      )
      .join("");

    res
      .type("application/xml")
      .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  })
);

export default router;
