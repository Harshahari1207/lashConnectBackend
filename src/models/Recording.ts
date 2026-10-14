
import mongoose, { Schema } from "mongoose";

const recordingSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: Date,
    durationSeconds: {
      type: Number,
      default: 0,
    },
    storageType: {
      type: String,
      enum: ["local", "cloud"],
      default: "local",
    },
    fileUrl: String,
    filePath: {
      type: String,
      select: false,
    },
    thumbnailUrl: String,
    sizeBytes: Number,
    status: {
      type: String,
      enum: ["recording", "completed", "failed"],
      default: "recording",
      index: true,
    },
    errorMessage: String,
  },
  { timestamps: true }
);

recordingSchema.index({
  ownerId: 1,
  startTime: -1,
});

export default mongoose.model(
  "Recording",
  recordingSchema
);
