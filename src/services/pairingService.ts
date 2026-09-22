import crypto from "crypto";
import { env } from "../config/environment";

export const createPairingToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + env.pairingTokenExpiresMinutes * 60 * 1000
  );

  return {
    token,
    tokenHash,
    expiresAt,
  };
};

export const verifyPairingToken = (
  token: string
) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};