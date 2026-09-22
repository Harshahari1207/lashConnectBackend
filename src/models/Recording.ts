import mongoose, {
  Schema,
  InferSchemaType
} from "mongoose";

const recordingSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      index: true
    },

    startTime: {
      type: Date,
      required: true
    },

    endTime: {
      type: Date,
      required: true
    },

    durationSeconds: {
      type: Number,
      required: true
    },

    storageType: {
      type: String,
      enum: [
        "local",
        "cloud"
      ],
      required: true
    },

    fileUrl: {
      type: String
    },

    thumbnailUrl: {
      type: String
    },

    sizeBytes: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

export type Recording =
  InferSchemaType<
    typeof recordingSchema
  >;

export default mongoose.model(
  "Recording",
  recordingSchema
);  