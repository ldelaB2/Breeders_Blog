import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import postsRouter from "./routes/posts.routes.js";
import commentsRouter from "./routes/comments.routes.js";
import meRouter from "./routes/me.routes.js";
import sitemapRouter from "./routes/sitemap.routes.js";
import webhooksRouter from "./routes/webhooks.routes.js";
import { HttpError } from "./lib/httpError.js";

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

// Needs the raw request body to verify Clerk's signature, so it's mounted
// with express.raw() ahead of the JSON parser and the rate limiter.
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), webhooksRouter);

// Bumped from Express's 100kb default for metadata payloads only - post
// uploads and stitched HTML go straight to Supabase Storage via signed URLs
// and never pass through here. Kept under Vercel's ~4.5mb request limit.
app.use(express.json({ limit: "4mb" }));

// Caps abuse per client IP and bounds the Clerk API calls requireAuth can
// make. The counter is in-memory, so on Vercel it's per function instance -
// a coarse backstop; Vercel's firewall is the real DDoS layer.
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/posts", postsRouter);
app.use("/api", commentsRouter);
app.use("/api", meRouter);
app.use(sitemapRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// An HttpError carries a status and a client-safe message; anything else
// is a 500 and only ever logged.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
