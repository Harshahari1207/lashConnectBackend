import {
  Request,
  Response
} from "express";

import Alert from "../models/Alert";

import Device from "../models/Device";

export const getAlerts =
  async (
    req: Request,
    res: Response
  ) => {
    const devices =
      await Device.find({
        ownerId: req.user!.id
      }).select("_id");

    const deviceIds =
      devices.map(
        device => device._id
      );

    const alerts =
      await Alert.find({
        deviceId: {
          $in: deviceIds
        }
      })
        .populate(
          "deviceId",
          "name deviceId"
        )
        .sort({
          createdAt: -1
        })
        .limit(100);

    return res.json({
      success: true,
      data: alerts
    });
  };

export const markAlertRead =
  async (
    req: Request,
    res: Response
  ) => {
    const alert =
      await Alert.findByIdAndUpdate(
        req.params.id,
        {
          isRead: true
        },
        {
          new: true
        }
      );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found"
      });
    }

    return res.json({
      success: true,
      data: alert
    });
  };