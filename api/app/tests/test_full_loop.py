from datetime import date, timedelta

from fastapi.testclient import TestClient


def test_mvp_loop(client: TestClient) -> None:
    """Create Home → Room → Device → Task → Complete → Log → Dashboard."""
    home = client.post("/homes", json={"name": "Davidsonville House"}).json()
    room = client.post(
        f"/homes/{home['id']}/rooms", json={"name": "Utility Room"}
    ).json()
    device = client.post(
        f"/rooms/{room['id']}/devices",
        json={"name": "Whole-House Filter", "device_type": "Water Treatment"},
    ).json()

    due = date.today() - timedelta(days=1)
    task = client.post(
        f"/devices/{device['id']}/tasks",
        json={
            "title": "Replace sediment filter",
            "recurrence_type": "monthly",
            "recurrence_interval": 3,
            "due_date": due.isoformat(),
        },
    ).json()

    # Overdue before completion.
    dashboard = client.get(f"/homes/{home['id']}/dashboard").json()
    assert dashboard["counts"]["overdue"] == 1

    completion = client.post(
        f"/tasks/{task['id']}/complete",
        json={"notes": "Replaced.", "cost_cents": 1800},
    ).json()
    assert completion["log"]["title"] == "Replace sediment filter"

    # Next due date generated automatically, dashboard cleared.
    assert completion["task"]["due_date"] is not None
    dashboard_after = client.get(f"/homes/{home['id']}/dashboard").json()
    assert dashboard_after["counts"]["overdue"] == 0
    assert len(dashboard_after["recently_completed"]) == 1
