import {
  Request,
  Response
} from "express";

import Recording from "../models/Recording";

import Device from "../models/Device";

export const getRecordings =
  async (
    req: Request,
    res: Response
  ) => {
    const device =
      await Device.findOne({
        _id: req.params.deviceId,
        ownerId: req.user!.id
      });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    const recordings =
      await Recording.find({
        deviceId: device._id
      }).sort({
        startTime: -1
      });

    return res.json({
      success: true,
      data: recordings
    });
  };