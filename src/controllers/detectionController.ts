
import {
  Request,
  Response,
  NextFunction
} from "express";

import {
  timingSafeEqual
} from "crypto";

import {
  createDetectionAlert,
  DetectionServiceError
} from "../services/detectionService";

// Validate detector API key
function validKey(provided: unknown): boolean {
  const expected = process.env.DETECTOR_KEY;

  if (
    !expected ||
    typeof provided !== "string"
  ) {
    return false;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  return (
    a.length === b.length &&
    timingSafeEqual(a, b)
  );
}

export async function createDetectionEvent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Authenticate detector
    if (!validKey(req.header("x-detector-key"))) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized detector"
      });
    }

    // Call service layer
    const result = await createDetectionAlert(
      req.body ?? {}
    );

    // Cooldown active
    if (result.skipped) {
      return res.status(200).json({
        success: true,
        skipped: true,
        message: "Detection alert skipped due to cooldown"
      });
    }

    // Alert created
    return res.status(201).json({
      success: true,
      message: "Detection alert created successfully",
      data: result.alert
    });

  } catch (error) {
    if (error instanceof DetectionServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}
