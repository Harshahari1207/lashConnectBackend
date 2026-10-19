
import Alert from "../models/Alert";
import Device from "../models/Device";

export type AnalyticsPeriod = "day" | "week" | "month";

export async function getAlertAnalytics(
  userId: string,
  period: AnalyticsPeriod
) {
  const now = new Date();
  const start = new Date(now);

  if (period === "day") {
    start.setUTCHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = (start.getUTCDay() + 6) % 7;
    start.setUTCDate(start.getUTCDate() - day);
    start.setUTCHours(0, 0, 0, 0);
  } else {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
  }

  const devices = await Device.find({
    ownerId: userId
  }).select("_id");

  const deviceIds = devices.map(d => d._id);

  const alerts = await Alert.find({
    deviceId: { $in: deviceIds },
    type: "motion",
    "metadata.source": "person-detector",
    createdAt: { $gte: start, $lte: now }
  }).select("createdAt metadata.personCount isRead");

  const points: {
    label: string;
    count: number;
    persons: number;
  }[] = [];

  const bucketCount =
    period === "day"
      ? 24
      : period === "week"
        ? 7
        : new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth() + 1,
              0
            )
          ).getUTCDate();

  for (let i = 0; i < bucketCount; i++) {
    let label: string;

    if (period === "day") {
      label = `${String(i).padStart(2, "0")}:00`;
    } else if (period === "week") {
      label = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i];
    } else {
      label = String(i + 1);
    }

    points.push({ label, count: 0, persons: 0 });
  }

  let totalPersons = 0;
  let unreadAlerts = 0;

  for (const alert of alerts) {
    const date = new Date(alert.createdAt);

    let index: number;

    if (period === "day") {
      index = date.getUTCHours();
    } else if (period === "week") {
      index = (date.getUTCDay() + 6) % 7;
    } else {
      index = date.getUTCDate() - 1;
    }

    const persons =
      typeof alert.metadata?.personCount === "number"
        ? alert.metadata.personCount
        : 0;

    points[index].count += 1;
    points[index].persons += persons;

    totalPersons += persons;

    if (!alert.isRead) {
      unreadAlerts++;
    }
  }

  const peak = points.reduce(
    (max, point) =>
      point.count > max.count ? point : max,
    points[0]
  );

  const elapsedDays = Math.max(
    1,
    Math.ceil(
      (now.getTime() - start.getTime()) /
        (24 * 60 * 60 * 1000)
    )
  );

  return {
    period,
    totalAlerts: alerts.length,
    totalPersons,
    unreadAlerts,
    averagePerDay: Number(
      (alerts.length / elapsedDays).toFixed(1)
    ),
    peakPeriod: peak.label,
    peakCount: peak.count,
    chartData: points
  };
}
