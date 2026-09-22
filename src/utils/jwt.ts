import jwt from "jsonwebtoken";
import { env } from "../config/environment";

export interface JwtPayload {
  userId: string;
  role: string;
}

export const generateToken = (
  payload: JwtPayload
): string => {
  return jwt.sign(
    payload,
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    } as jwt.SignOptions
  );
};

export const verifyToken = (
  token: string
): JwtPayload => {
  return jwt.verify(
    token,
    env.jwtSecret
  ) as JwtPayload;
};