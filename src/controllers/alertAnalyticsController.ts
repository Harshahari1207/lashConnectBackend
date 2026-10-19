
import { Request, Response } from "express";

import {
  getAlertAnalytics,
  AnalyticsPeriod
} from "../services/alertAnalyticsService";

export const getAnalytics = async (
  req: Request,
  res: Response
) => {
  const period = req.query.period ?? "week";

  if (
    period !== "day" &&
    period !== "week" &&
    period !== "month"
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid period"
    });
  }

  const analytics = await getAlertAnalytics(
    req.user!.id,
    period as AnalyticsPeriod
  );

  return res.status(200).json({
    success: true,
    data: analytics
  });
};
