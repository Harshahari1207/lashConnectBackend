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
import {
  getAnalytics
} from "../controllers/alertAnalyticsController";

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

router.get(
  "/analytics",
  asyncHandler(getAnalytics)
);

export default router;