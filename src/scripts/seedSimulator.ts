
import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import Device from "../models/Device";
import { hashToken } from "../utils/crypto";

async function seedSimulator() {
  try {
    await connectDatabase();

    await Device.findOneAndUpdate(
      { deviceId: "cam_test_001" },
      {
        $set: {
          name: "Simulated Camera",
          type: "camera",
          status: "unknown",
          ownerId: null,
          paired: false,
          pairingTokenHash: hashToken("test123"),
          pairingExpiresAt: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ),
          rtspUrl: "rtsp://127.0.0.1:8554/camera1",
          streamPath: "camera1",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log("Simulator device registered.");
    console.log("Device ID: cam_test_001");
    console.log("Pairing token: test123");
  } catch (error) {
    console.error("Simulator setup failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedSimulator();