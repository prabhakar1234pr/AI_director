import os
from datetime import timedelta
from google.cloud import storage

_bucket_name = os.getenv("GCP_BUCKET_NAME", "ai-director-mvp-media")
_client = storage.Client()


def upload_bytes(gcs_path: str, data: bytes, content_type: str) -> str:
    """Upload bytes to GCS and return a signed URL valid for 24 hours."""
    bucket = _client.bucket(_bucket_name)
    blob = bucket.blob(gcs_path)
    blob.upload_from_string(data, content_type=content_type)
    url = blob.generate_signed_url(
        expiration=timedelta(hours=24),
        method="GET",
        version="v4",
    )
    return url
