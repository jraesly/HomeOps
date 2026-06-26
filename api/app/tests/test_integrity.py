"""Delete-cascade / SET NULL data-integrity tests."""

from fastapi.testclient import TestClient


def test_delete_home_cascades_children(
    client: TestClient, home_id: str, device_id: str
) -> None:
    # device_id created a room + device under home_id; add a task + consumable.
    room = client.get(f"/homes/{home_id}/rooms").json()[0]
    task = client.post(
        f"/devices/{device_id}/tasks", json={"title": "Replace filter"}
    ).json()
    consumable = client.post(
        f"/homes/{home_id}/consumables", json={"name": "Filter"}
    ).json()

    assert client.delete(f"/homes/{home_id}").status_code == 204

    assert client.get(f"/homes/{home_id}").status_code == 404
    assert client.get(f"/rooms/{room['id']}").status_code == 404
    assert client.get(f"/devices/{device_id}").status_code == 404
    assert client.get(f"/tasks/{task['id']}").status_code == 404
    assert client.get(f"/consumables/{consumable['id']}").status_code == 404


def test_delete_device_nulls_task_and_log_fks(
    client: TestClient, home_id: str, device_id: str
) -> None:
    task = client.post(
        f"/devices/{device_id}/tasks", json={"title": "Service"}
    ).json()
    client.post(
        f"/devices/{device_id}/logs", json={"title": "Manual repair"}
    )

    assert client.delete(f"/devices/{device_id}").status_code == 204

    # Task survives with a nulled device_id.
    refreshed = client.get(f"/tasks/{task['id']}")
    assert refreshed.status_code == 200
    assert refreshed.json()["device_id"] is None

    # The log survives at the home level with a nulled device_id.
    logs = client.get(f"/homes/{home_id}/logs").json()
    assert len(logs) == 1
    assert logs[0]["device_id"] is None


def test_device_next_due_reflects_soonest_active_task(
    client: TestClient, home_id: str, device_id: str
) -> None:
    assert client.get(f"/devices/{device_id}").json()["next_due"] is None

    client.post(
        f"/devices/{device_id}/tasks",
        json={"title": "Later", "due_date": "2026-09-01"},
    )
    client.post(
        f"/devices/{device_id}/tasks",
        json={"title": "Sooner", "due_date": "2026-07-01"},
    )

    device = client.get(f"/devices/{device_id}").json()
    assert device["next_due"] == "2026-07-01"

    listed = client.get(f"/homes/{home_id}/devices").json()
    assert listed[0]["next_due"] == "2026-07-01"
