import { Router } from "express";

import {
  getCameraStream,
  ptzControl
} from "../controllers/cameraController";

import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/:id/stream",
  authenticate,
  getCameraStream
);

router.post(
  "/:id/ptz",
  authenticate,
  ptzControl
);

export default router;