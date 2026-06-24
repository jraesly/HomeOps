from fastapi.testclient import TestClient


def test_create_room(client: TestClient, home_id: str) -> None:
    response = client.post(
        f"/homes/{home_id}/rooms",
        json={"name": "Kitchen", "room_type": "kitchen"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Kitchen"


def test_room_requires_existing_home(client: TestClient) -> None:
    missing = "00000000-0000-0000-0000-0000000000ff"
    response = client.post(f"/homes/{missing}/rooms", json={"name": "Kitchen"})
    assert response.status_code == 404


def test_create_device_in_room(client: TestClient, home_id: str) -> None:
    room = client.post(
        f"/homes/{home_id}/rooms", json={"name": "Utility Room"}
    ).json()
    response = client.post(
        f"/rooms/{room['id']}/devices",
        json={"name": "Water Softener", "device_type": "Water Treatment"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Water Softener"
    assert body["device_type"] == "Water Treatment"
    assert body["room_id"] == room["id"]
    assert body["home_id"] == home_id


def test_create_device_in_home_without_room(
    client: TestClient, home_id: str
) -> None:
    response = client.post(
        f"/homes/{home_id}/devices", json={"name": "Router"}
    )
    assert response.status_code == 201
    assert response.json()["room_id"] is None


def test_list_devices(client: TestClient, home_id: str, device_id: str) -> None:
    response = client.get(f"/homes/{home_id}/devices")
    assert response.status_code == 200
    ids = [d["id"] for d in response.json()]
    assert device_id in ids
