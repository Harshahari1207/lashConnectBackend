import { Router } from "express";

import {
  authenticate
} from "../middleware/authMiddleware";

import {
  getRecordings
} from "../controllers/recordingController";

import {
  asyncHandler
} from "../utils/asyncHandler";

const router =
  Router();

router.use(authenticate);

router.get(
  "/device/:deviceId",
  asyncHandler(getRecordings)
);

export default router;