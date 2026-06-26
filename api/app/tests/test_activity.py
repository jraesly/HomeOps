from fastapi.testclient import TestClient


def test_timeline_records_create_complete_and_inventory(
    client: TestClient, home_id: str, device_id: str
) -> None:
    # device_id fixture created a device → device_created event.
    consumable = client.post(
        f"/homes/{home_id}/consumables",
        json={"name": "Sediment filter", "quantity_on_hand": 2},
    ).json()
    task = client.post(
        f"/devices/{device_id}/tasks",
        json={"title": "Replace filter", "recurrence_type": "monthly"},
    ).json()
    client.post(
        f"/tasks/{task['id']}/consumables",
        json={"consumable_id": consumable["id"], "quantity_required": 1},
    )
    client.post(f"/tasks/{task['id']}/complete", json={})

    timeline = client.get(f"/homes/{home_id}/timeline").json()
    types = {e["event_type"] for e in timeline}
    assert {
        "device_created",
        "task_created",
        "task_completed",
        "inventory_used",
    } <= types

    # Newest first.
    occurred = [e["occurred_at"] for e in timeline]
    assert occurred == sorted(occurred, reverse=True)


def test_manual_log_records_log_added(
    client: TestClient, home_id: str, device_id: str
) -> None:
    client.post(
        f"/devices/{device_id}/logs",
        json={"title": "HVAC tech replaced capacitor"},
    )
    timeline = client.get(f"/homes/{home_id}/timeline").json()
    assert any(e["event_type"] == "log_added" for e in timeline)


def test_device_timeline_filters_by_device(
    client: TestClient, home_id: str, device_id: str
) -> None:
    other = client.post(
        f"/homes/{home_id}/devices", json={"name": "Furnace"}
    ).json()

    device_events = client.get(f"/devices/{device_id}/timeline").json()
    assert all(e["device_id"] == device_id for e in device_events)
    assert all(e["device_id"] != other["id"] for e in device_events)


def test_search_matches_across_entities(
    client: TestClient, home_id: str, device_id: str
) -> None:
    client.post(
        f"/devices/{device_id}/tasks",
        json={"title": "Replace sediment filter"},
    )
    client.post(
        f"/homes/{home_id}/consumables", json={"name": "Whole-house filter"}
    )

    results = client.get(f"/homes/{home_id}/search", params={"q": "filter"}).json()
    assert any("filter" in t["title"].lower() for t in results["tasks"])
    assert any("filter" in c["name"].lower() for c in results["consumables"])
    # The "Whole-House Filter" device from the fixture also matches.
    assert any("filter" in d["name"].lower() for d in results["devices"])


def test_search_is_case_insensitive(
    client: TestClient, home_id: str, device_id: str
) -> None:
    # Fixture device is named "Whole-House Filter"; an uppercase query matches.
    results = client.get(
        f"/homes/{home_id}/search", params={"q": "WHOLE"}
    ).json()
    assert any("whole" in d["name"].lower() for d in results["devices"])
