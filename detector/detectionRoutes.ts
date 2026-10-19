import { Router } from 'express';
import { createDetectionEvent } from '../controllers/detectionController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.post('/', asyncHandler(createDetectionEvent));
export default router;
