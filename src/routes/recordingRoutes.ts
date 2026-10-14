
import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

import {
  createRecording,
  finishRecording,
  getRecordings,
  getRecording,
  streamRecording,
} from "../controllers/recordingController";

const router = Router();

router.use(authenticate);

router.post(
  "/start",
  asyncHandler(createRecording)
);

router.post(
  "/:id/stop",
  asyncHandler(finishRecording)
);

router.get(
  "/",
  asyncHandler(getRecordings)
);

router.get(
  "/:id",
  asyncHandler(getRecording)
);

router.get(
  "/:id/video",
  asyncHandler(streamRecording)
);

export default router;
