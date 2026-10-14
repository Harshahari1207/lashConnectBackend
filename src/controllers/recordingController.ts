import { Request, Response } from "express";
import mongoose from "mongoose";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

import Device from "../models/Device";
import Recording from "../models/Recording";
import { startRecording, stopRecording } from "../services/recordingService";


export const createRecording = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;

    const recording = await startRecording(deviceId, req.user!.id);

    return res.status(201).json({
      success: true,
      data: recording,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const finishRecording = async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid recording ID",
    });
  }

  try {
    const recordingId = req.params.id;

    if (typeof recordingId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid recording ID",
      });
    }

    const recording = await stopRecording(recordingId, req.user!.id);

    return res.json({
      success: true,
      data: recording,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const getRecordings = async (req: Request, res: Response) => {
  const devices = await Device.find({
    ownerId: req.user!.id,
  }).select("_id");

  const deviceIds = devices.map((device) => device._id);

  const filter: Record<string, unknown> = {
    deviceId: { $in: deviceIds },
    status: "completed",
  };

  if (req.query.deviceId) {
    const deviceId = String(req.query.deviceId);

    if (!mongoose.isValidObjectId(deviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device ID",
      });
    }

    filter.deviceId = {
      $in: deviceIds.filter((id) => String(id) === deviceId),
    };
  }

  const recordings = await Recording.find(filter)
    .sort({ startTime: -1 })
    .limit(100);

  return res.json({
    success: true,
    data: recordings,
  });
};

export const getRecording = async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.sendStatus(400);
  }

  const recording = await Recording.findOne({
    _id: req.params.id,
    ownerId: req.user!.id,
  });

  if (!recording) {
    return res.sendStatus(404);
  }

  return res.json({
    success: true,
    data: recording,
  });
};

export const streamRecording = async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.sendStatus(400);
  }

  const recording = await Recording.findOne({
    _id: req.params.id,
    ownerId: req.user!.id,
    status: "completed",
  }).select("+filePath");

  if (!recording?.filePath) {
    return res.sendStatus(404);
  }

  let size: number;

  try {
    size = (await stat(recording.filePath)).size;
  } catch {
    return res.sendStatus(404);
  }

  const range = req.headers.range;

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "private, no-store");

  if (!range) {
    res.setHeader("Content-Length", size);
    createReadStream(recording.filePath).pipe(res);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);

  if (!match) {
    res.setHeader("Content-Range", `bytes */${size}`);
    return res.sendStatus(416);
  }

  const suffix = match[1] === "" && match[2] !== "";

  const start = suffix
    ? Math.max(0, size - Number(match[2]))
    : Number(match[1]);

  const end = suffix ? size - 1 : match[2] ? Number(match[2]) : size - 1;

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    end >= size
  ) {
    res.setHeader("Content-Range", `bytes */${size}`);
    return res.sendStatus(416);
  }

  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
  res.setHeader("Content-Length", end - start + 1);

  createReadStream(recording.filePath, {
    start,
    end,
  }).pipe(res);
};
