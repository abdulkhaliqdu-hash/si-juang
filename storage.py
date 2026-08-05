import os
import mimetypes
from typing import Optional
import io

# Support for Cloudflare R2 (S3-compatible) and Supabase Storage.
# - R2: requires boto3
# - Supabase: requires the `supabase` python package (supabase-py)

try:
    import boto3
    from botocore.client import Config
except Exception:
    boto3 = None

try:
    from supabase import create_client
except Exception:
    create_client = None


def is_r2_configured() -> bool:
    return all(os.environ.get(k) for k in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"))


def is_supabase_configured() -> bool:
    return all(os.environ.get(k) for k in ("SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_BUCKET"))


# ---- Cloudflare R2 helpers ----
def _r2_client():
    if boto3 is None:
        raise RuntimeError("boto3 is required for R2 support. Install with: pip install boto3")
    account = os.environ["R2_ACCOUNT_ID"]
    endpoint = f"https://{account}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
    )


def _upload_r2(data: bytes, key: str, content_type: Optional[str], presign_seconds: int) -> str:
    client = _r2_client()
    bucket = os.environ["R2_BUCKET"]

    if not content_type:
        content_type = mimetypes.guess_type(key)[0] or "application/octet-stream"

    client.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)

    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=presign_seconds,
        )
        return url
    except Exception:
        account = os.environ["R2_ACCOUNT_ID"]
        endpoint = f"https://{account}.r2.cloudflarestorage.com"
        return f"{endpoint}/{bucket}/{key}"


# ---- Supabase helpers ----
def _supabase_client():
    if create_client is None:
        raise RuntimeError("supabase package required. Install with: pip install supabase")
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    return create_client(url, key)


def _upload_supabase(data: bytes, key: str, content_type: Optional[str], presign_seconds: int = 3600) -> str:
    """Upload to Supabase Storage and return a public or signed URL.

    Requires SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET env vars.
    """
    client = _supabase_client()
    bucket = os.environ["SUPABASE_BUCKET"]

    # supabase-py expects a file-like or path. Use BytesIO.
    file_obj = io.BytesIO(data)

    # upload - this will overwrite if object exists
    client.storage.from_(bucket).upload(key, file_obj, opts={})

    # try to create signed URL (preferred) then fallback to public URL
    try:
        signed = client.storage.from_(bucket).create_signed_url(key, presign_seconds)
        # create_signed_url returns dict like { 'signedURL': '...' } or { 'signedURL': ..., 'error': None }
        if isinstance(signed, dict):
            # new versions may return {'signedURL': url}
            for v in ("signedURL", "signed_url", "signedurl", "signedUrl"):
                if v in signed and signed[v]:
                    return signed[v]
        # fallback
    except Exception:
        pass

    try:
        pub = client.storage.from_(bucket).get_public_url(key)
        if isinstance(pub, dict):
            return pub.get("publicURL") or pub.get("public_url") or str(pub)
        return str(pub)
    except Exception as e:
        raise RuntimeError(f"Failed to get Supabase URL: {e}")


# ---- Public API ----
def upload_bytes(data: bytes, key: str, content_type: Optional[str] = None, presign_seconds: int = 3600) -> str:
    """Upload bytes to configured storage.

    Priority: Supabase (if configured) -> Cloudflare R2 (if configured).
    Returns a URL (signed or public) to access the uploaded object.
    """
    # Prefer Supabase if available (you said you're using Supabase)
    if is_supabase_configured():
        return _upload_supabase(data, key, content_type, presign_seconds)

    if is_r2_configured():
        return _upload_r2(data, key, content_type, presign_seconds)

    raise RuntimeError("No object storage configured. Set SUPABASE_* or R2_* environment variables.")


def public_url_for(key: str) -> str:
    """Return a public URL for the given key based on configured provider."""
    if is_supabase_configured():
        url = os.environ.get("SUPABASE_URL")
        bucket = os.environ.get("SUPABASE_BUCKET")
        if not url or not bucket:
            raise RuntimeError("SUPABASE_URL and SUPABASE_BUCKET must be set")
        # Supabase public URL pattern: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
        return f"{url.rstrip('/')}/storage/v1/object/public/{bucket}/{key}"

    if is_r2_configured():
        account = os.environ.get("R2_ACCOUNT_ID")
        bucket = os.environ.get("R2_BUCKET")
        if not account or not bucket:
            raise RuntimeError("R2_ACCOUNT_ID and R2_BUCKET must be set to construct public URL")
        return f"https://{account}.r2.cloudflarestorage.com/{bucket}/{key}"

    raise RuntimeError("No object storage configured.")
