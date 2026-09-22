import mongoose, {
  Schema,
  InferSchemaType
} from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    role: {
      type: String,
      enum: [
        "admin",
        "operator",
        "viewer"
      ],
      default: "viewer"
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export type User = InferSchemaType<
  typeof userSchema
>;

export default mongoose.model(
  "User",
  userSchema
);