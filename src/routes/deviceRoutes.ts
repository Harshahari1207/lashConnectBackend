import { Router } from "express";

import {
  authenticate
} from "../middleware/authMiddleware";

import {
  authorize
} from "../middleware/roleMiddleware";

import {
  getDevices,
  getDevice,
  pairDevice,
  renameDevice,
  deleteDevice
} from "../controllers/deviceController";

import {
  asyncHandler
} from "../utils/asyncHandler";

const router =
  Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(getDevices)
);

router.get(
  "/:id",
  asyncHandler(getDevice)
);

router.post(
  "/pair",
  asyncHandler(pairDevice)
);

router.put(
  "/:id",
  authorize(
    "admin",
    "operator"
  ),
  asyncHandler(renameDevice)
);

router.delete(
  "/:id",
  authorize("admin"),
  asyncHandler(deleteDevice)
);

export default router;