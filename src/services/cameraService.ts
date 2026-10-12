import Device from "../models/Device";

export const getCameraStreamInfo =
  async (
    deviceId: string,
    userId: string
  ) => {
    const device =
      await Device.findOne({
        deviceId: deviceId,
        ownerId: userId,
        type: "camera"
      }).select(
        "+rtspUrl"
      );

    if (!device) {
      throw new Error(
        "Camera not found"
      );
    }

    return {
      deviceId: device.id,

      /*
       * This is intentionally NOT
       * returned to the mobile app.
       *
       * The media server should expose
       * a WebRTC endpoint instead.
       */

      streamPath:
        device.streamPath,
      rtspUrl:
        device.rtspUrl
    };
  };