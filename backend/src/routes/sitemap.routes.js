import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const router = Router();

// Lists every approved post's permalink so search engines can find them -
// nothing else on the site links to posts by URL.
router.get(
  "/sitemap.xml",
  asyncHandler(async (req, res) => {
    const posts = await prisma.postMetadata.findMany({
      where: { status: "APPROVED" },
      select: { id: true, updatedAt: true },
    });
    const urls = posts
      .map((p) => `<url><loc>${process.env.SITE_URL}/posts/${p.id}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`)
      .join("");
    res
      .type("application/xml")
      .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  })
);

export default router;
