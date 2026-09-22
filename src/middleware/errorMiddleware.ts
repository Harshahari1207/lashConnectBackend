import {
  Request,
  Response,
  NextFunction
} from "express";

export const errorMiddleware = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(error);

  const statusCode =
    error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      error.message ||
      "Internal server error"
  });
};