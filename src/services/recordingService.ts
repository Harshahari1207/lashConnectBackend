
import {
  spawn,
  type ChildProcessWithoutNullStreams,
} from "child_process";

import { mkdir, stat, unlink } from "fs/promises";
import path from "path";

import Device from "../models/Device";
import Recording from "../models/Recording";

const RECORDINGS_DIR = path.resolve(
  process.env.RECORDINGS_DIR || "recordings",
);

const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";

// Your local MediaMTX HLS server.
// Android uses 10.0.2.2, but the Windows backend uses 127.0.0.1.
const HLS_BASE_URL =
  process.env.HLS_BASE_URL || "http://127.0.0.1:8888";

const STOP_TIMEOUT_MS = 15000;

type ActiveRecording = {
  process: ChildProcessWithoutNullStreams;
  finished: Promise<void>;
  stopping: boolean;
  requestStop: () => void;
};

const active = new Map<string, ActiveRecording>();

function getHlsUrl(streamPath: string): string {
  const cleanPath = streamPath
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (!cleanPath) {
    throw new Error("Camera stream path is missing");
  }

  const baseUrl = HLS_BASE_URL.replace(/\/+$/, "");

  return `${baseUrl}/${cleanPath}/index.m3u8`;
}

export async function startRecording(
  deviceId: string,
  userId: string,
) {
  // deviceId is the camera identifier, e.g. cam_test_001.
  // It is not the MongoDB ObjectId.
  const device = await Device.findOne({
    deviceId,
    ownerId: userId,
    type: "camera",
  }).select("+rtspUrl");

  if (!device) {
    throw new Error(`Camera not found: ${deviceId}`);
  }

  if (!device.streamPath) {
    throw new Error(
      `Stream path missing for camera: ${deviceId}`,
    );
  }

  const streamUrl = getHlsUrl(device.streamPath);

  console.log("[Recording] Camera found:", {
    deviceId: device.deviceId,
    mongoId: String(device._id),
    streamPath: device.streamPath,
    streamUrl,
  });

  await mkdir(RECORDINGS_DIR, {
    recursive: true,
  });

  console.log(
    "[Recording] Output directory:",
    RECORDINGS_DIR,
  );

  // Prevent multiple simultaneous recordings for the same camera.
  const existingRecording = await Recording.findOne({
    deviceId: device._id,
    ownerId: userId,
    status: "recording",
  });

  if (existingRecording) {
    throw new Error(
      "This camera already has an active recording",
    );
  }

  const recording = await Recording.create({
    deviceId: device._id,
    ownerId: userId,
    startTime: new Date(),
    storageType: "local",
    status: "recording",
  });

  const id = String(recording._id);

  const output = path.join(
    RECORDINGS_DIR,
    `${id}.mp4`,
  );

  recording.set("filePath", output);
  await recording.save();

  console.log("[Recording] Starting:", {
    recordingId: id,
    streamUrl,
    output,
  });

  // HLS input: no -rtsp_transport option is needed.
  const args = [
    "-hide_banner",
    "-loglevel",
    "info",
    "-i",
    streamUrl,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    "-y",
    output,
  ];

  const ffmpeg = spawn(FFMPEG_PATH, args, {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });

  let stderr = "";
  let finalized = false;

  let resolveFinished!: () => void;

  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  const finalize = async (code: number | null) => {
    if (finalized) {
      return;
    }

    finalized = true;

    console.log("[Recording] FFmpeg exited:", {
      recordingId: id,
      code,
    });

    let sizeBytes = 0;

    try {
      const fileInfo = await stat(output);
      sizeBytes = fileInfo.size;
    } catch {
      console.error(
        "[Recording] MP4 file not found:",
        output,
      );
    }

    const endTime = new Date();

    const completed = code === 0 && sizeBytes > 0;

    try {
      await Recording.findByIdAndUpdate(id, {
        endTime,
        durationSeconds: Math.max(
          0,
          Math.round(
            (endTime.getTime() -
              recording.startTime.getTime()) / 1000,
          ),
        ),
        sizeBytes,
        status: completed ? "completed" : "failed",
        errorMessage: completed
          ? null
          : stderr.slice(-4000) ||
            `FFmpeg exited with code ${code}`,
        fileUrl: completed
          ? `/api/recordings/${id}/video`
          : null,
      });

      if (completed) {
        console.log(
          "[Recording] Saved successfully:",
          {
            recordingId: id,
            output,
            sizeBytes,
          },
        );
      } else {
        console.error("[Recording] Failed:", {
          recordingId: id,
          output,
          code,
          stderr,
        });

        await unlink(output).catch(() => {});
      }
    } catch (error) {
      console.error(
        "[Recording] Database finalization failed:",
        error,
      );
    } finally {
      active.delete(id);
      resolveFinished();
    }
  };

  ffmpeg.stderr.on("data", (chunk: Buffer) => {
    const message = chunk.toString();

    stderr = (stderr + message).slice(-8000);

    console.log("[FFmpeg]", message.trim());
  });

  ffmpeg.on("error", (error) => {
    stderr += `\n${error.message}`;

    console.error(
      "[Recording] FFmpeg process error:",
      error,
    );

    void finalize(-1);
  });

  ffmpeg.on("close", (code) => {
    void finalize(code);
  });

  const requestStop = () => {
    if (
      ffmpeg.exitCode !== null ||
      ffmpeg.killed
    ) {
      return;
    }

    if (ffmpeg.stdin.writable) {
      ffmpeg.stdin.write("q\n");
    } else {
      console.warn(
        "[Recording] FFmpeg stdin unavailable:",
        id,
      );
    }
  };

  active.set(id, {
    process: ffmpeg,
    finished,
    stopping: false,
    requestStop,
  });

  return recording;
}

export async function stopRecording(
  recordingId: string,
  userId: string,
) {
  const recording = await Recording.findOne({
    _id: recordingId,
    ownerId: userId,
  });

  if (!recording) {
    throw new Error("Recording not found");
  }

  if (recording.status !== "recording") {
    return recording;
  }

  const session = active.get(recordingId);

  if (!session) {
    throw new Error(
      "Recording process unavailable. Check backend logs.",
    );
  }

  if (!session.stopping) {
    session.stopping = true;

    console.log(
      "[Recording] Stopping:",
      recordingId,
    );

    session.requestStop();
  }

  // Wait for FFmpeg to finalize the MP4.
  // If FFmpeg hangs, terminate it instead of hanging forever.
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const result = await Promise.race([
    session.finished.then(() => "finished" as const),
    new Promise<"timeout">((resolve) => {
      timeout = setTimeout(
        () => resolve("timeout"),
        STOP_TIMEOUT_MS,
      );
    }),
  ]);

  if (timeout) {
    clearTimeout(timeout);
  }

  if (result === "timeout") {
    console.error(
      "[Recording] FFmpeg stop timeout:",
      recordingId,
    );

    session.process.kill();

    throw new Error(
      "Recording finalization timed out. Check backend logs.",
    );
  }

  const updatedRecording = await Recording.findById(
    recordingId,
  );

  if (!updatedRecording) {
    throw new Error(
      "Recording not found after stopping",
    );
  }

  console.log("[Recording] Final status:", {
    recordingId,
    status: updatedRecording.status,
    sizeBytes: updatedRecording.sizeBytes,
    filePath: updatedRecording.filePath,
  });

  if (updatedRecording.status !== "completed") {
    throw new Error(
      "FFmpeg could not save the recording. Check backend logs.",
    );
  }

  return updatedRecording;
}
