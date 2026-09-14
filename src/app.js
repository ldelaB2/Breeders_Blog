import express from "express";
import cors from "cors";
import postsRouter from "./routes/posts.routes.js";
import commentsRouter from "./routes/comments.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/posts", postsRouter);
app.use("/api", commentsRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
