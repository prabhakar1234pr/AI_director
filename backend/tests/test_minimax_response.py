"""Unit tests for MiniMax image API response parsing (no network)."""

import base64
import unittest

from services.image import minimax_extract_image_download_target


class TestMinimaxExtract(unittest.TestCase):
    def test_image_urls_shape(self):
        data = {
            "data": {"image_urls": ["https://cdn.example.com/a.jpg"]},
            "base_resp": {"status_code": 0, "status_msg": "success"},
        }
        url, raw = minimax_extract_image_download_target(data)
        self.assertEqual(url, "https://cdn.example.com/a.jpg")
        self.assertIsNone(raw)

    def test_image_base64_shape(self):
        payload = b"\xff\xd8\xff_dummy_jpeg"
        b64 = base64.b64encode(payload).decode("ascii")
        data = {
            "data": {"image_base64": [b64]},
            "base_resp": {"status_code": 0, "status_msg": "success"},
        }
        url, raw = minimax_extract_image_download_target(data)
        self.assertIsNone(url)
        self.assertEqual(raw, payload)

    def test_legacy_list_url_shape(self):
        data = {
            "data": [{"url": "https://legacy.example.com/x.png"}],
            "base_resp": {"status_code": 0, "status_msg": "success"},
        }
        url, raw = minimax_extract_image_download_target(data)
        self.assertEqual(url, "https://legacy.example.com/x.png")
        self.assertIsNone(raw)

    def test_empty_data(self):
        self.assertEqual(minimax_extract_image_download_target({}), (None, None))
        self.assertEqual(minimax_extract_image_download_target({"data": {}}), (None, None))


if __name__ == "__main__":
    unittest.main()
