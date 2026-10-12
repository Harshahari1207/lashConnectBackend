import {
  Request,
  Response
} from "express";

import {
  getCameraStreamInfo
} from "../services/cameraService";

type CameraParams = {
  id: string;
};

export const getCameraStream =
  async (
    req: Request<CameraParams>,
    res: Response
  ) => {
    const cameraId = req.params.id;

    const stream =
      await getCameraStreamInfo(
        cameraId,
        req.user!.id
      );
    console.log(
      `Camera ${cameraId} stream info: ${JSON.stringify(stream)}`
    )
    return res.json({
      success: true,
      data: stream
    });
  };

export const ptzControl =
  async (
    req: Request<CameraParams>,
    res: Response
  ) => {
    const {
      action
    } = req.body;

    const allowedActions = [
      "up",
      "down",
      "left",
      "right",
      "zoomIn",
      "zoomOut",
      "home",
      "stop"
    ];

    if (
      !allowedActions.includes(action)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid PTZ action"
      });
    }

    const cameraId = req.params.id;

    /*
     * Later this service will communicate
     * with the actual ONVIF/IP camera.
     */

    console.log(
      `PTZ ${action} -> camera ${cameraId}`
    );

    return res.json({
      success: true,
      message:
        `PTZ ${action} command accepted`
    });
  };