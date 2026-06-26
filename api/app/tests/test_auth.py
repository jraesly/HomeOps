"""API-key auth: open when unset, enforced when configured."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings


def test_open_when_no_api_key_configured(client: TestClient) -> None:
    # Default settings.api_key is empty → routes are open.
    assert client.get("/homes").status_code == 200


def test_health_always_open(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "api_key", "s3cret")
    assert client.get("/health").status_code == 200


def test_requires_key_when_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "api_key", "s3cret")

    assert client.get("/homes").status_code == 401
    assert (
        client.get("/homes", headers={"X-API-Key": "wrong"}).status_code == 401
    )
    assert (
        client.get("/homes", headers={"X-API-Key": "s3cret"}).status_code == 200
    )
