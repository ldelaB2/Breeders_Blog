import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import postsRouter from "./routes/posts.routes.js";
import commentsRouter from "./routes/comments.routes.js";
import meRouter from "./routes/me.routes.js";
import sitemapRouter from "./routes/sitemap.routes.js";
import webhooksRouter from "./routes/webhooks.routes.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

// Needs the raw request body to verify Clerk's signature, so it must be
// mounted (with express.raw(), not express.json()) before the global JSON
// body parser below.
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), webhooksRouter);

// Bumped from Express's 100kb default: stitched HTML uploaded on approve
// travels through this JSON body the same way rawMd already does. Capped
// at 4mb (not the full 5mb this endpoint could use) to stay under Vercel's
// ~4.5mb hard request body limit, which Express can't override.
app.use(express.json({ limit: "4mb" }));

// Caps write-endpoint abuse and bounds the Clerk API calls requireAuth
// makes per request (one per authenticated call).
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });

app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use("/api/posts", writeLimiter, postsRouter);
app.use("/api", writeLimiter, commentsRouter);
app.use("/api", meRouter);
app.use(sitemapRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
