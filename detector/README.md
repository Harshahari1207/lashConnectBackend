# LashConnect person detection integration

## File placement
- `detector.py`, `requirements.txt`: create a separate `lashconnect-detector/` folder beside the backend and frontend.
- `detectionController.ts`: backend `src/controllers/`.
- `detectionRoutes.ts`: backend `src/routes/`.

## Backend app.ts changes
Add import: `import detectionRoutes from './routes/detectionRoutes';`
Add before not-found middleware: `app.use('/api/detection-events', detectionRoutes);`

## Backend .env
Set `DETECTOR_KEY` to a long random secret (use the same secret in the detector's environment). Keep it out of Git.

## Detector environment (PowerShell)
```
$env:DETECTOR_KEY="YOUR_LONG_RANDOM_SECRET"
$env:BACKEND_URL="http://127.0.0.1:5000"  # adjust to actual backend port
$env:STREAM_URL="rtsp://127.0.0.1:8554/camera1"
$env:DEVICE_ID="cam_test_001"
```

## Install and start
```
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python detector.py
```
The first run downloads `yolo11n.pt`. Ensure MediaMTX and the simulated camera source are running and the camera is paired to an account.

## Frontend
Existing AlertsScreen fetches alerts when focused and on pull-to-refresh. Open the Alerts tab or pull to refresh to see new detections. No frontend code changes are required for this first version. Real-time alert push is not implemented.

## Important
- Detector sends a POST only on detection; `personCount` and confidence are derived from YOLO.
- The backend checks a secret key, validates the event, and verifies the camera is paired.
- Alerts are saved as existing `motion` type with `Person Detected` title.
- The 30-second server-side cooldown is a simple best-effort check; for multiple simultaneous detector processes use an atomic rate-limit strategy.
- Treat model predictions as fallible; this is a prototype, not a certified safety/security system.
