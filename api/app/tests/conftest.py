from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.main import app
from app.models import Base
from app.routers.deps import ensure_default_user


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """A TestClient backed by an isolated in-memory SQLite database."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_sqlite_fks(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    testing_session = sessionmaker(
        bind=engine, autoflush=False, autocommit=False
    )

    seed_session = testing_session()
    ensure_default_user(seed_session)
    seed_session.close()

    def override_get_db() -> Generator:
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def home_id(client: TestClient) -> str:
    response = client.post("/homes", json={"name": "Davidsonville House"})
    assert response.status_code == 201
    return response.json()["id"]


@pytest.fixture
def device_id(client: TestClient, home_id: str) -> str:
    room = client.post(
        f"/homes/{home_id}/rooms", json={"name": "Utility Room"}
    ).json()
    device = client.post(
        f"/rooms/{room['id']}/devices",
        json={"name": "Whole-House Filter", "device_type": "Water Treatment"},
    )
    assert device.status_code == 201
    return device.json()["id"]
