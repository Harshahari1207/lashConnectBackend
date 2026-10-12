import {
  Request,
  Response,
  NextFunction
} from "express";

import Device from "../models/Device";

import {
  hashToken
} from "../utils/crypto";

export const getDevices =
  async (
    req: Request,
    res: Response
  ) => {
    const devices =
      await Device.find({
        ownerId: req.user!.id
      }).select(
        "-pairingTokenHash -pairingExpiresAt -rtspUrl"
      );

    return res.json({
      success: true,
      data: devices
    });
  };

export const getDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const device = await Device.findOne({ deviceId: id });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

export const pairDevice =
  async (
    req: Request,
    res: Response
  ) => {
    const {
      deviceId,
      pairingToken
    } = req.body;

    if (
      !deviceId ||
      !pairingToken
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Device ID and pairing token are required"
      });
    }

    const device =
      await Device.findOne({
        deviceId
      }).select(
        "+pairingTokenHash +pairingExpiresAt"
      );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    if (device.paired) {
      return res.status(409).json({
        success: false,
        message: "Device already paired"
      });
    }

    if (
      !device.pairingTokenHash ||
      !device.pairingExpiresAt
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Device does not have an active pairing request"
      });
    }

    if (
      device.pairingExpiresAt.getTime() <
      Date.now()
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Pairing token has expired"
      });
    }

    const receivedHash =
      hashToken(pairingToken);

    if (
      receivedHash !==
      device.pairingTokenHash
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid pairing token"
      });
    }

    device.ownerId =
      req.user!.id as any;

    device.paired = true;

    device.pairingTokenHash =
      undefined;

    device.pairingExpiresAt =
      undefined;

    await device.save();

    return res.json({
      success: true,
      message:
        "Device paired successfully",
      data: {
        id: device.id,
        deviceId: device.deviceId,
        name: device.name,
        type: device.type,
        status: device.status
      }
    });
  };

export const renameDevice =
  async (
    req: Request,
    res: Response
  ) => {
    const {
      name
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Device name is required"
      });
    }

    const device =
      await Device.findOneAndUpdate(
        {
          _id: req.params.id,
          ownerId: req.user!.id
        },
        {
          name
        },
        {
          new: true
        }
      );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    return res.json({
      success: true,
      data: device
    });
  };

export const deleteDevice =
  async (
    req: Request,
    res: Response
  ) => {
    const device =
      await Device.findOneAndDelete({
        _id: req.params.id,
        ownerId: req.user!.id
      });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    return res.json({
      success: true,
      message:
        "Device deleted successfully"
    });
  };