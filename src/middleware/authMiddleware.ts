import {
  Request,
  Response,
  NextFunction
} from "express";

import { verifyToken } from "../utils/jwt";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const token =
      authorization.substring(7);

    const decoded =
      verifyToken(token);

    req.user = {
      id: decoded.userId,
      role: decoded.role as
        | "admin"
        | "operator"
        | "viewer"
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};