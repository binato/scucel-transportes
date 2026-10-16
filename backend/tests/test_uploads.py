import os
import tempfile
import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.routers import uploads


class ReceiptUploadTests(unittest.TestCase):
    def test_accepts_small_image_and_rejects_invalid_content(self):
        app = FastAPI()
        app.include_router(uploads.router)
        with tempfile.TemporaryDirectory() as directory:
            original = uploads.UPLOAD_DIR
            uploads.UPLOAD_DIR = directory
            try:
                with TestClient(app) as client:
                    saved = client.post('/api/uploads/comprovante', files={'file': ('nota.jpg', b'\xff\xd8\xffpayload', 'image/jpeg')})
                    self.assertEqual(saved.status_code, 200, saved.text)
                    self.assertTrue(os.path.exists(os.path.join(directory, saved.json()['url'].split('/')[-1])))
                    invalid = client.post('/api/uploads/comprovante', files={'file': ('falsa.jpg', b'not an image', 'image/jpeg')})
                    self.assertEqual(invalid.status_code, 400)
            finally:
                uploads.UPLOAD_DIR = original


if __name__ == '__main__':
    unittest.main()
