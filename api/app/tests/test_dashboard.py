from datetime import date, timedelta

from fastapi.testclient import TestClient


def _create_task(client: TestClient, device_id: str, title: str, due: date) -> None:
    response = client.post(
        f"/devices/{device_id}/tasks",
        json={
            "title": title,
            "recurrence_type": "monthly",
            "recurrence_interval": 1,
            "due_date": due.isoformat(),
        },
    )
    assert response.status_code == 201


def test_dashboard_buckets_tasks(
    client: TestClient, home_id: str, device_id: str
) -> None:
    today = date.today()
    _create_task(client, device_id, "Overdue task", today - timedelta(days=5))
    _create_task(client, device_id, "Due soon task", today + timedelta(days=7))
    _create_task(client, device_id, "Upcoming task", today + timedelta(days=30))

    response = client.get(f"/homes/{home_id}/dashboard")
    assert response.status_code == 200
    body = response.json()

    assert body["counts"] == {"overdue": 1, "due_soon": 1, "upcoming": 1}
    assert body["overdue"][0]["title"] == "Overdue task"
    assert body["due_soon"][0]["title"] == "Due soon task"
    assert body["upcoming"][0]["title"] == "Upcoming task"

    # One medium-priority overdue task → 100 - 2 = 98.
    assert body["home_health_score"] == 98


def test_dashboard_updates_after_completion(
    client: TestClient, home_id: str, device_id: str
) -> None:
    today = date.today()
    task = client.post(
        f"/devices/{device_id}/tasks",
        json={
            "title": "Overdue filter",
            "recurrence_type": "monthly",
            "recurrence_interval": 1,
            "due_date": (today - timedelta(days=3)).isoformat(),
        },
    ).json()

    before = client.get(f"/homes/{home_id}/dashboard").json()
    assert before["counts"]["overdue"] == 1

    client.post(f"/tasks/{task['id']}/complete", json={})

    after = client.get(f"/homes/{home_id}/dashboard").json()
    # Completing the overdue task rolls it forward out of the overdue bucket.
    assert after["counts"]["overdue"] == 0
    assert len(after["recently_completed"]) == 1
