import { Router } from "express";

import {
  authenticate
} from "../middleware/authMiddleware";

import {
  authorize
} from "../middleware/roleMiddleware";

import {
  getUsers,
  updateUserRole
} from "../controllers/userController";

import {
  asyncHandler
} from "../utils/asyncHandler";

const router =
  Router();

router.use(authenticate);

router.get(
  "/",
  authorize("admin"),
  asyncHandler(getUsers)
);

router.patch(
  "/:id/role",
  authorize("admin"),
  asyncHandler(updateUserRole)
);

export default router;