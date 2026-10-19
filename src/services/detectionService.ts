
import Device from "../models/Device";
import Alert from "../models/Alert";

export interface DetectionPayload {
  deviceId: string;
  personCount: number;
  confidence: number;
}

export class DetectionServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "DetectionServiceError";
  }
}

export const createDetectionAlert = async (
  payload: DetectionPayload
) => {
  const { deviceId, personCount, confidence } = payload;

  // Validate detection payload
  if (
    typeof deviceId !== "string" ||
    !deviceId.trim() ||
    !Number.isInteger(personCount) ||
    personCount < 1 ||
    personCount > 100 ||
    typeof confidence !== "number" ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw new DetectionServiceError(
      400,
      "Invalid detection payload"
    );
  }

  // Find paired camera
  const device = await Device.findOne({
    deviceId: deviceId.trim(),
    type: "camera",
    paired: true,
    ownerId: { $ne: null }
  });

  if (!device) {
    throw new DetectionServiceError(
      404,
      "Paired camera not found"
    );
  }

  // Prevent duplicate alerts within 30 seconds
  const cooldownMs = 30_000;

  const recentAlert = await Alert.findOne({
    deviceId: device._id,
    type: "motion",
    "metadata.source": "person-detector",
    createdAt: {
      $gte: new Date(Date.now() - cooldownMs)
    }
  });

  if (recentAlert) {
    return {
      skipped: true,
      alert: null
    };
  }

  // Save alert in MongoDB
  const alert = await Alert.create({
    deviceId: device._id,
    type: "motion",
    title: "Person Detected",
    message: `${personCount} person${
      personCount === 1 ? "" : "s"
    } detected on ${device.name}`,
    metadata: {
      source: "person-detector",
      personCount,
      confidence
    },
    isRead: false
  });

  return {
    skipped: false,
    alert
  };
};
