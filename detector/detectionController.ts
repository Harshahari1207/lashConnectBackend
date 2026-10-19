import { Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';
import Device from '../src/models/Device';
import Alert from '../src/models/Alert';

function validKey(provided: unknown): boolean {
  const expected = process.env.DETECTOR_KEY;
  if (!expected || typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createDetectionEvent(req: Request, res: Response) {
  if (!validKey(req.header('x-detector-key'))) {
    return res.status(401).json({ success: false, message: 'Unauthorized detector' });
  }

  const { deviceId, personCount, confidence } = req.body ?? {};
  if (typeof deviceId !== 'string' || !deviceId ||
      !Number.isInteger(personCount) || personCount < 1 || personCount > 100 ||
      typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    return res.status(400).json({ success: false, message: 'Invalid detection payload' });
  }

  const device = await Device.findOne({ deviceId, type: 'camera', paired: true, ownerId: { $ne: null } });
  if (!device) return res.status(404).json({ success: false, message: 'Paired camera not found' });

  // Additional server-side cooldown (per camera) prevents bursts from multiple detectors.
  const cooldownMs = 30_000;
  const recent = await Alert.findOne({
    deviceId: device._id,
    type: 'motion',
    'metadata.source': 'person-detector',
    createdAt: { $gte: new Date(Date.now() - cooldownMs) },
  });
  if (recent) return res.status(200).json({ success: true, skipped: true });

  const alert = await Alert.create({
    deviceId: device._id,
    type: 'motion', // existing enum; no schema change required
    title: 'Person Detected',
    message: `${personCount} person${personCount === 1 ? '' : 's'} detected on ${device.name}`,
    metadata: { source: 'person-detector', personCount, confidence },
  });
  return res.status(201).json({ success: true, data: alert });
}
