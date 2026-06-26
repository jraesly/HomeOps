import secrets

from fastapi import Header, HTTPException, status

from app.core.config import settings


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Require a valid X-API-Key header when an API key is configured.

    When ``settings.api_key`` is empty the check is a no-op, so the API stays
    open until a key is set in the deployment environment (avoids locking out
    an already-running client before it ships the key).
    """
    if not settings.api_key:
        return
    if x_api_key is None or not secrets.compare_digest(x_api_key, settings.api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
