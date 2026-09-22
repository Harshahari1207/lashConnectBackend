import mongoose, {
  Schema,
  InferSchemaType
} from "mongoose";

const deviceSchema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: [
        "camera",
        "sensor",
        "door",
        "alarm"
      ],
      default: "camera"
    },

    status: {
      type: String,
      enum: [
        "online",
        "offline",
        "unknown"
      ],
      default: "unknown"
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    paired: {
      type: Boolean,
      default: false
    },

    pairingTokenHash: {
      type: String,
      select: false
    },

    pairingExpiresAt: {
      type: Date,
      select: false
    },

    rtspUrl: {
      type: String,
      select: false
    },

    streamPath: {
      type: String
    },

    location: {
      type: String,
      default: ""
    },

    lastSeenAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export type DeviceDocument = InferSchemaType<
  typeof deviceSchema
>;

const Device = mongoose.model(
  "Device",
  deviceSchema
);

export default Device;