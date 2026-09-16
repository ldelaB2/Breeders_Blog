import "dotenv/config";
import app from "./app.js";

const port = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => console.log(`Backend listening on port ${port}`));
}
