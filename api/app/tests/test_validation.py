"""Tests for failure paths: the not-active 409 and cross-home 400 guards."""

from fastapi.testclient import TestClient


def _make_home(client: TestClient, name: str) -> str:
    return client.post("/homes", json={"name": name}).json()["id"]


def test_complete_paused_task_returns_409(
    client: TestClient, device_id: str
) -> None:
    task = client.post(
        f"/devices/{device_id}/tasks", json={"title": "Inspect"}
    ).json()
    client.patch(f"/tasks/{task['id']}", json={"status": "paused"})

    response = client.post(f"/tasks/{task['id']}/complete", json={})
    assert response.status_code == 409


def test_room_with_area_from_other_home_returns_400(
    client: TestClient, home_id: str
) -> None:
    other = _make_home(client, "Other House")
    area = client.post(f"/homes/{other}/areas", json={"name": "Main"}).json()

    response = client.post(
        f"/homes/{home_id}/rooms",
        json={"name": "Kitchen", "area_id": area["id"]},
    )
    assert response.status_code == 400


def test_device_with_room_from_other_home_returns_400(
    client: TestClient, home_id: str
) -> None:
    other = _make_home(client, "Other House")
    room = client.post(
        f"/homes/{other}/rooms", json={"name": "Garage"}
    ).json()

    response = client.post(
        f"/homes/{home_id}/devices",
        json={"name": "Opener", "room_id": room["id"]},
    )
    assert response.status_code == 400


def test_log_with_task_from_other_device_returns_400(
    client: TestClient, home_id: str, device_id: str
) -> None:
    other_device = client.post(
        f"/homes/{home_id}/devices", json={"name": "Furnace"}
    ).json()
    other_task = client.post(
        f"/devices/{other_device['id']}/tasks", json={"title": "Service"}
    ).json()

    response = client.post(
        f"/devices/{device_id}/logs",
        json={"title": "Did work", "task_id": other_task["id"]},
    )
    assert response.status_code == 400


def test_link_consumable_from_other_home_returns_400(
    client: TestClient, home_id: str, device_id: str
) -> None:
    other = _make_home(client, "Other House")
    consumable = client.post(
        f"/homes/{other}/consumables", json={"name": "Filter"}
    ).json()
    task = client.post(
        f"/devices/{device_id}/tasks", json={"title": "Replace"}
    ).json()

    response = client.post(
        f"/tasks/{task['id']}/consumables",
        json={"consumable_id": consumable["id"]},
    )
    assert response.status_code == 400
