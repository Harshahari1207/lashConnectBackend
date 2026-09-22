import Device from "../models/Device";
import {
  createPairingToken,
  verifyPairingToken
} from "./pairingService";

export interface CreateDeviceInput {
  deviceId: string;
  name: string;
  type?: "camera" | "sensor" | "door" | "alarm";
  rtspUrl?: string;
  location?: string;
  streamPath?: string;
}

export interface UpdateDeviceInput {
  name?: string;
  type?: "camera" | "sensor" | "door" | "alarm";
  rtspUrl?: string;
  location?: string;
  streamPath?: string;
  status?: "online" | "offline" | "unknown";
}

/**
 * Get all devices owned by a user.
 */
export const getUserDevices = async (
  userId: string
) => {
  return Device.find({
    ownerId: userId
  }).sort({
    createdAt: -1
  });
};

/**
 * Get one device owned by a user.
 */
export const getDeviceById = async (
  deviceId: string,
  userId: string
) => {
  return Device.findOne({
    deviceId,
    ownerId: userId
  });
};

/**
 * Create a new device.
 */
export const createDevice = async (
  userId: string,
  input: CreateDeviceInput
) => {
  const existingDevice = await Device.findOne({
    deviceId: input.deviceId
  });

  if (existingDevice) {
    throw new Error(
      "A device with this deviceId already exists"
    );
  }

  const device = await Device.create({
    deviceId: input.deviceId,
    name: input.name,
    type: input.type ?? "camera",
    ownerId: userId,
    paired: true,
    status: "unknown",
    rtspUrl: input.rtspUrl,
    location: input.location ?? "",
    streamPath: input.streamPath
  });

  return device;
};

/**
 * Update a device.
 */
export const updateDevice = async (
  deviceId: string,
  userId: string,
  input: UpdateDeviceInput
) => {
  const device = await Device.findOneAndUpdate(
    {
      deviceId,
      ownerId: userId
    },
    {
      $set: input
    },
    {
      new: true,
      runValidators: true
    }
  );

  return device;
};

/**
 * Delete a device.
 */
export const deleteDevice = async (
  deviceId: string,
  userId: string
) => {
  return Device.findOneAndDelete({
    deviceId,
    ownerId: userId
  });
};

/**
 * Generate a temporary pairing token.
 */
export const generateDevicePairingToken = async (
  userId: string,
  deviceId: string
) => {
  const device = await Device.findOne({
    deviceId,
    ownerId: userId
  }).select(
    "+pairingTokenHash +pairingExpiresAt"
  );

  if (!device) {
    throw new Error("Device not found");
  }

  const {
    token,
    tokenHash,
    expiresAt
  } = createPairingToken();

  device.pairingTokenHash = tokenHash;
  device.pairingExpiresAt = expiresAt;
  device.paired = false;

  await device.save();

  return {
    deviceId: device.deviceId,
    token,
    expiresAt
  };
};

/**
 * Pair a device using a temporary pairing token.
 */
export const pairDevice = async (
  token: string,
  deviceInformation: {
    deviceId: string;
    name?: string;
    type?: "camera" | "sensor" | "door" | "alarm";
    rtspUrl?: string;
    streamPath?: string;
    location?: string;
  }
) => {
  const tokenHash = verifyPairingToken(token);

  if (!tokenHash) {
    return null;
  }

  const device = await Device.findOne({
    deviceId: deviceInformation.deviceId,
    pairingTokenHash: tokenHash,
    pairingExpiresAt: {
      $gt: new Date()
    }
  }).select(
    "+pairingTokenHash +pairingExpiresAt"
  );

  if (!device) {
    return null;
  }

  if (deviceInformation.name) {
    device.name = deviceInformation.name;
  }

  if (deviceInformation.type) {
    device.type = deviceInformation.type;
  }

  if (deviceInformation.rtspUrl) {
    device.rtspUrl = deviceInformation.rtspUrl;
  }

  if (deviceInformation.streamPath) {
    device.streamPath =
      deviceInformation.streamPath;
  }

  if (deviceInformation.location) {
    device.location =
      deviceInformation.location;
  }

  device.paired = true;
  device.status = "online";
  device.lastSeenAt = new Date();

  // One-time token: remove it after successful pairing.
  device.pairingTokenHash = undefined;
  device.pairingExpiresAt = undefined;

  await device.save();

  return Device.findOne({
    deviceId: device.deviceId
  });
};

/**
 * Change device status.
 */
export const setDeviceStatus = async (
  deviceId: string,
  userId: string,
  status: "online" | "offline" | "unknown"
) => {
  return Device.findOneAndUpdate(
    {
      deviceId,
      ownerId: userId
    },
    {
      $set: {
        status,
        lastSeenAt: new Date()
      }
    },
    {
      new: true
    }
  );
};

/**
 * Update the last-seen time of a device.
 */
export const updateLastSeen = async (
  deviceId: string
) => {
  return Device.findOneAndUpdate(
    {
      deviceId
    },
    {
      $set: {
        lastSeenAt: new Date(),
        status: "online"
      }
    },
    {
      new: true
    }
  );
};