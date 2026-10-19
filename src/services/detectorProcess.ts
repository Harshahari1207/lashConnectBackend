import { spawn, ChildProcess } from "child_process";
import path from "path";

let detectorProcess: ChildProcess | null = null;

export function startDetector() {
  if (detectorProcess) {
    console.log("Detector already running");
    return;
  }

  const pythonPath = path.resolve(
    process.cwd(),
    "detector",
    ".venv",
    "Scripts",
    "python.exe"
  );

  const scriptPath = path.resolve(
    process.cwd(),
    "detector",
    "detector.py"
  );

  console.log("Starting person detection service...");

  detectorProcess = spawn(
    pythonPath,
    [scriptPath],
    {
      cwd: path.dirname(scriptPath),
      env: {
        ...process.env,
        BACKEND_URL:
          `http://127.0.0.1:${process.env.PORT || 5000}`,
        STREAM_URL:
          process.env.STREAM_URL ||
          "rtsp://127.0.0.1:8888/camera1",
        DEVICE_ID:
          process.env.DEVICE_ID || "cam_test_001",
      },
      stdio: "inherit",
    }
  );

  detectorProcess.on("error", (error) => {
    console.error("Detector failed:", error);
    detectorProcess = null;
  });

  detectorProcess.on("exit", (code) => {
    console.log(`Detector exited: ${code}`);
    detectorProcess = null;
  });
}

export function stopDetector() {
  if (detectorProcess) {
    detectorProcess.kill();
    detectorProcess = null;
  }
}