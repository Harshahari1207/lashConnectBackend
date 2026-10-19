import os
import time
import logging
import cv2
import requests
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
STREAM_URL = os.getenv('STREAM_URL', 'http://127.0.0.1:8888/camera1/index.m3u8')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://127.0.0.1:5000').rstrip('/')
DEVICE_ID = os.getenv('DEVICE_ID', 'cam_test_001')
DETECTOR_KEY = os.environ['DETECTOR_KEY']
MODEL = os.getenv('YOLO_MODEL', 'yolo11n.pt')
CONFIDENCE = float(os.getenv('CONFIDENCE', '0.55'))
COOLDOWN_SECONDS = float(os.getenv('COOLDOWN_SECONDS', '30'))
FRAME_INTERVAL = float(os.getenv('FRAME_INTERVAL', '0.4'))


def run():
    model = YOLO(MODEL)
    last_alert = 0.0
    session = requests.Session()
    while True:
        cap = cv2.VideoCapture(STREAM_URL, cv2.CAP_FFMPEG)
        if not cap.isOpened():
            logging.warning('Unable to open camera stream; retrying')
            cap.release()
            time.sleep(3)
            continue
        logging.info('Connected to %s', STREAM_URL)
        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    logging.warning('Stream interrupted; reconnecting')
                    break
                result = model.predict(source=frame, classes=[0], conf=CONFIDENCE, verbose=False)[0]
                count = len(result.boxes)
                now = time.monotonic()
                if count and now - last_alert >= COOLDOWN_SECONDS:
                    payload = {'deviceId': DEVICE_ID, 'personCount': count, 'confidence': round(float(result.boxes.conf.max()), 3)}
                    try:
                        response = session.post(
                            f'{BACKEND_URL}/api/detection-events',
                            json=payload,
                            headers={'x-detector-key': DETECTOR_KEY},
                            timeout=8,
                        )
                        response.raise_for_status()
                        last_alert = now
                        logging.info('Alert created: %s', payload)
                    except requests.RequestException as error:
                        logging.error('Failed to create alert: %s', error)
                time.sleep(FRAME_INTERVAL)
        finally:
            cap.release()
        time.sleep(2)


if __name__ == '__main__':
    run()
