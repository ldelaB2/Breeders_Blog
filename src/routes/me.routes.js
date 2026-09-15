import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// The only way the frontend learns a signed-in user's own role (e.g. to
// decide whether to show the Admin nav link) - role otherwise never
// appears in any other API response.
router.get("/me", requireAuth, (req, res) => {
  res.json({ id: req.userId, name: req.userName, role: req.userRole });
});

export default router;
