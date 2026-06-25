from fastapi.testclient import TestClient


def test_create_and_get_home(client: TestClient) -> None:
    created = client.post(
        "/homes",
        json={"name": "Davidsonville House", "timezone": "America/New_York"},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Davidsonville House"
    assert body["timezone"] == "America/New_York"

    fetched = client.get(f"/homes/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == body["id"]


def test_list_homes(client: TestClient) -> None:
    client.post("/homes", json={"name": "House A"})
    client.post("/homes", json={"name": "House B"})
    response = client.get("/homes")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_update_home(client: TestClient, home_id: str) -> None:
    response = client.patch(f"/homes/{home_id}", json={"name": "Renamed"})
    assert response.status_code == 200
    assert response.json()["name"] == "Renamed"


def test_delete_home(client: TestClient, home_id: str) -> None:
    assert client.delete(f"/homes/{home_id}").status_code == 204
    assert client.get(f"/homes/{home_id}").status_code == 404


def test_get_missing_home_returns_404(client: TestClient) -> None:
    missing = "00000000-0000-0000-0000-0000000000ff"
    assert client.get(f"/homes/{missing}").status_code == 404


def test_database_url_normalized_to_psycopg() -> None:
    from app.core.config import Settings

    assert Settings(
        database_url="postgres://u:p@h:5432/db"
    ).database_url.startswith("postgresql+psycopg://")
    assert Settings(
        database_url="postgresql://u:p@h:5432/db"
    ).database_url.startswith("postgresql+psycopg://")
