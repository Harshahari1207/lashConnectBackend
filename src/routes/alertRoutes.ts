import { Router } from "express";

import {
  authenticate
} from "../middleware/authMiddleware";

import {
  getAlerts,
  markAlertRead
} from "../controllers/alertController";

import {
  asyncHandler
} from "../utils/asyncHandler";

const router =
  Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(getAlerts)
);

router.patch(
  "/:id/read",
  asyncHandler(markAlertRead)
);

export default router;