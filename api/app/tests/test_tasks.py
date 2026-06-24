from datetime import date

from fastapi.testclient import TestClient


def test_create_task(client: TestClient, device_id: str) -> None:
    response = client.post(
        f"/devices/{device_id}/tasks",
        json={
            "title": "Replace sediment filter",
            "task_type": "replace_filter",
            "recurrence_type": "monthly",
            "recurrence_interval": 3,
            "due_date": "2026-07-01",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Replace sediment filter"
    assert body["device_id"] == device_id
    assert body["status"] == "active"


def test_complete_recurring_task_creates_log_and_advances_due_date(
    client: TestClient, device_id: str
) -> None:
    due = date(2026, 6, 1)
    task = client.post(
        f"/devices/{device_id}/tasks",
        json={
            "title": "Replace sediment filter",
            "recurrence_type": "monthly",
            "recurrence_interval": 1,
            "due_date": due.isoformat(),
        },
    ).json()

    completed_at = "2026-06-15T10:00:00Z"
    response = client.post(
        f"/tasks/{task['id']}/complete",
        json={
            "completed_at": completed_at,
            "notes": "Water pressure improved.",
            "cost_cents": 1800,
            "performed_by": "John",
        },
    )
    assert response.status_code == 200
    result = response.json()

    # A maintenance log captures what happened.
    assert result["log"]["title"] == "Replace sediment filter"
    assert result["log"]["cost_cents"] == 1800
    assert result["log"]["performed_by"] == "John"
    assert result["log"]["device_id"] == device_id

    # The task advances one month from the completion date and stays active.
    assert result["task"]["status"] == "active"
    assert result["task"]["due_date"] == "2026-07-15"
    assert result["task"]["last_completed_at"] is not None

    # The completion shows up in device history.
    logs = client.get(f"/devices/{device_id}/logs").json()
    assert len(logs) == 1


def test_task_flags_round_trip(client: TestClient, device_id: str) -> None:
    task = client.post(
        f"/devices/{device_id}/tasks",
        json={
            "title": "Replace capacitor",
            "task_type": "service",
            "requires_parts": True,
            "contractor_required": True,
        },
    ).json()
    assert task["requires_parts"] is True
    assert task["contractor_required"] is True

    # Defaults are False when omitted.
    plain = client.post(
        f"/devices/{device_id}/tasks", json={"title": "Visual inspection"}
    ).json()
    assert plain["requires_parts"] is False
    assert plain["contractor_required"] is False


def test_complete_one_time_task_marks_completed_once(
    client: TestClient, device_id: str
) -> None:
    task = client.post(
        f"/devices/{device_id}/tasks",
        json={"title": "Inspect unit", "recurrence_type": "none"},
    ).json()

    result = client.post(f"/tasks/{task['id']}/complete", json={}).json()
    assert result["task"]["status"] == "completed_once"
    assert result["task"]["due_date"] is None


def test_complete_missing_task_returns_404(client: TestClient) -> None:
    missing = "00000000-0000-0000-0000-0000000000ff"
    assert client.post(f"/tasks/{missing}/complete", json={}).status_code == 404


def test_manual_log_without_task(client: TestClient, device_id: str) -> None:
    response = client.post(
        f"/devices/{device_id}/logs",
        json={"title": "HVAC tech replaced capacitor", "cost_cents": 25000},
    )
    assert response.status_code == 201
    assert response.json()["task_id"] is None
