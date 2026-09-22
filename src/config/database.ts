import mongoose from "mongoose";
import { env } from "./environment";

export const connectDatabase = async () => {
  console.log("MongoDB URI exists:", !!env.mongoUri);

  if (!env.mongoUri) {
    throw new Error(
      "MONGODB_URI is missing from .env"
    );
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error);

    throw error;
  }
};