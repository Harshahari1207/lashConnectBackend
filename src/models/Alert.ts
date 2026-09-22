import mongoose, {
  Schema,
  InferSchemaType
} from "mongoose";

const alertSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        "motion",
        "offline",
        "online",
        "tamper",
        "unknown"
      ],
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    isRead: {
      type: Boolean,
      default: false
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export type Alert = InferSchemaType<
  typeof alertSchema
>;

export default mongoose.model(
  "Alert",
  alertSchema
);