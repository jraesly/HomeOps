from fastapi.testclient import TestClient


def test_consumable_crud(client: TestClient, home_id: str) -> None:
    created = client.post(
        f"/homes/{home_id}/consumables",
        json={
            "name": "16x25x1 HVAC Filter",
            "category": "filter",
            "quantity_on_hand": 3,
            "reorder_threshold": 1,
        },
    )
    assert created.status_code == 201
    cid = created.json()["id"]
    assert created.json()["quantity_on_hand"] == 3

    listed = client.get(f"/homes/{home_id}/consumables")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    patched = client.patch(
        f"/consumables/{cid}", json={"quantity_on_hand": 5}
    )
    assert patched.json()["quantity_on_hand"] == 5

    assert client.delete(f"/consumables/{cid}").status_code == 204
    assert client.get(f"/homes/{home_id}/consumables").json() == []


def test_complete_task_deducts_inventory(
    client: TestClient, home_id: str, device_id: str
) -> None:
    consumable = client.post(
        f"/homes/{home_id}/consumables",
        json={"name": "Sediment filter", "quantity_on_hand": 2, "reorder_threshold": 1},
    ).json()
    task = client.post(
        f"/devices/{device_id}/tasks",
        json={"title": "Replace sediment filter", "recurrence_type": "monthly"},
    ).json()

    link = client.post(
        f"/tasks/{task['id']}/consumables",
        json={"consumable_id": consumable["id"], "quantity_required": 1},
    )
    assert link.status_code == 201

    client.post(f"/tasks/{task['id']}/complete", json={})

    after = client.get(f"/consumables/{consumable['id']}").json()
    assert after["quantity_on_hand"] == 1


def test_complete_task_can_skip_deduction(
    client: TestClient, home_id: str, device_id: str
) -> None:
    consumable = client.post(
        f"/homes/{home_id}/consumables",
        json={"name": "Salt bag", "quantity_on_hand": 4},
    ).json()
    task = client.post(
        f"/devices/{device_id}/tasks", json={"title": "Add salt"}
    ).json()
    client.post(
        f"/tasks/{task['id']}/consumables",
        json={"consumable_id": consumable["id"], "quantity_required": 2},
    )

    client.post(
        f"/tasks/{task['id']}/complete", json={"deduct_inventory": False}
    )

    after = client.get(f"/consumables/{consumable['id']}").json()
    assert after["quantity_on_hand"] == 4


def test_deduction_floors_at_zero(
    client: TestClient, home_id: str, device_id: str
) -> None:
    consumable = client.post(
        f"/homes/{home_id}/consumables",
        json={"name": "Last filter", "quantity_on_hand": 1},
    ).json()
    task = client.post(
        f"/devices/{device_id}/tasks", json={"title": "Replace"}
    ).json()
    client.post(
        f"/tasks/{task['id']}/consumables",
        json={"consumable_id": consumable["id"], "quantity_required": 5},
    )

    client.post(f"/tasks/{task['id']}/complete", json={})

    after = client.get(f"/consumables/{consumable['id']}").json()
    assert after["quantity_on_hand"] == 0


def test_dashboard_low_stock(client: TestClient, home_id: str) -> None:
    client.post(
        f"/homes/{home_id}/consumables",
        json={"name": "Low filter", "quantity_on_hand": 1, "reorder_threshold": 1},
    )
    client.post(
        f"/homes/{home_id}/consumables",
        json={"name": "Stocked salt", "quantity_on_hand": 10, "reorder_threshold": 2},
    )

    dashboard = client.get(f"/homes/{home_id}/dashboard").json()
    names = [c["name"] for c in dashboard["low_stock"]]
    assert "Low filter" in names
    assert "Stocked salt" not in names
