import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes";

import deviceRoutes from "./routes/deviceRoutes";

import userRoutes from "./routes/userRoutes";

import alertRoutes from "./routes/alertRoutes";

import recordingRoutes from "./routes/recordingRoutes";

import cameraRoutes from "./routes/cameraRoutes";

import profileRoutes from "./routes/profileRoutes";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware";

import { errorMiddleware } from "./middleware/errorMiddleware";

import { env } from "./config/environment";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.clientUrl === "*" ? true : env.clientUrl,

    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.json({
    name: "Lash Connect API",
    version: "1.0.0",
    status: "running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Lash Connect API is healthy",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/devices", deviceRoutes);

app.use("/api/users", userRoutes);

app.use("/api/alerts", alertRoutes);

app.use("/api/recordings", recordingRoutes);

app.use("/api/cameras", cameraRoutes);
app.use("/api/profile", profileRoutes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;
