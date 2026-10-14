
import { Router } from "express";

import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/profileController";

// Use the same authentication middleware import
// already used by your recordingRoutes.ts.
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", authenticate, getMyProfile);
router.patch("/me", authenticate, updateMyProfile);

export default router;
