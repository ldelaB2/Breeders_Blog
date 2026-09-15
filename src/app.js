import express from "express";
import cors from "cors";
import postsRouter from "./routes/posts.routes.js";
import commentsRouter from "./routes/comments.routes.js";
import meRouter from "./routes/me.routes.js";

const app = express();

app.use(cors());
// Bumped from Express's 100kb default: stitched HTML uploaded on approve
// travels through this JSON body the same way rawMd already does.
app.use(express.json({ limit: "5mb" }));

app.use("/api/posts", postsRouter);
app.use("/api", commentsRouter);
app.use("/api", meRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
