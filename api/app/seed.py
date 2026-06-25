"""Seed a realistic demo home (the Davidsonville House).

Run with ``python -m app.seed`` (or ``make seed``). Idempotent: it does nothing
if the demo home already exists.
"""

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.area import Area
from app.models.consumable import Consumable, TaskConsumable
from app.models.device import Device
from app.models.home import Home
from app.models.maintenance_log import MaintenanceLog
from app.models.maintenance_task import MaintenanceTask
from app.models.room import Room
from app.routers.deps import ensure_default_user

DEMO_HOME_NAME = "Davidsonville House"


def seed_demo_home(db: Session) -> Home:
    """Create the demo home with areas, rooms, devices, tasks, and inventory."""
    user = ensure_default_user(db)
    home = Home(
        user_id=user.id, name=DEMO_HOME_NAME, timezone="America/New_York"
    )
    db.add(home)
    db.flush()

    main = Area(home_id=home.id, name="Main Floor", sort_order=0)
    basement = Area(home_id=home.id, name="Basement", sort_order=1)
    exterior = Area(home_id=home.id, name="Exterior", sort_order=2)
    db.add_all([main, basement, exterior])
    db.flush()

    utility = Room(home_id=home.id, area_id=basement.id, name="Utility Room")
    kitchen = Room(home_id=home.id, area_id=main.id, name="Kitchen")
    laundry = Room(home_id=home.id, area_id=main.id, name="Laundry Room")
    deck = Room(home_id=home.id, area_id=exterior.id, name="Back Deck")
    db.add_all([utility, kitchen, laundry, deck])
    db.flush()

    softener = Device(
        home_id=home.id,
        room_id=utility.id,
        name="Water Softener",
        device_type="Water Treatment",
    )
    whole_filter = Device(
        home_id=home.id,
        room_id=utility.id,
        name="Whole-House Filter",
        device_type="Water Treatment",
    )
    fridge = Device(
        home_id=home.id,
        room_id=kitchen.id,
        name="Refrigerator",
        device_type="Appliance",
    )
    dryer = Device(
        home_id=home.id,
        room_id=laundry.id,
        name="Dryer",
        device_type="Appliance",
        status="needs_service",
    )
    db.add_all([softener, whole_filter, fridge, dryer])
    db.flush()

    today = date.today()

    def task(device, title, rtype, interval, due_offset, **kwargs):
        return MaintenanceTask(
            home_id=home.id,
            device_id=device.id,
            title=title,
            recurrence_type=rtype,
            recurrence_interval=interval,
            due_date=today + timedelta(days=due_offset),
            **kwargs,
        )

    filter_task = task(
        whole_filter,
        "Replace sediment filter",
        "custom_days",
        90,
        -3,  # overdue
        task_type="replace_filter",
        priority="high",
        requires_parts=True,
    )
    salt_task = task(
        softener, "Check salt level", "monthly", 1, 5, task_type="inspect"
    )
    fridge_task = task(
        fridge,
        "Replace water filter",
        "custom_days",
        180,
        40,
        task_type="replace_filter",
        requires_parts=True,
    )
    dryer_task = task(
        dryer, "Clean lint vent", "quarterly", 1, 12, task_type="clean"
    )
    db.add_all([filter_task, salt_task, fridge_task, dryer_task])
    db.flush()

    sediment = Consumable(
        home_id=home.id,
        name="Whole-house sediment filter",
        category="filter",
        quantity_on_hand=1,
        reorder_threshold=1,
    )
    salt = Consumable(
        home_id=home.id,
        name="Water softener salt",
        category="salt",
        quantity_on_hand=0,
        reorder_threshold=2,
    )
    db.add_all([sediment, salt])
    db.flush()

    db.add(
        TaskConsumable(
            task_id=filter_task.id,
            consumable_id=sediment.id,
            quantity_required=1,
        )
    )

    # A bit of history so the device timeline isn't empty.
    db.add(
        MaintenanceLog(
            home_id=home.id,
            device_id=whole_filter.id,
            task_id=filter_task.id,
            completed_at=datetime.now(timezone.utc) - timedelta(days=93),
            title="Replace sediment filter",
            notes="Water pressure improved after replacement.",
            cost_cents=1800,
            performed_by="John",
        )
    )

    db.commit()
    return home


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(
            select(Home).where(Home.name == DEMO_HOME_NAME)
        )
        if existing is not None:
            print(f"Demo home '{DEMO_HOME_NAME}' already exists; skipping.")
            return
        home = seed_demo_home(db)
        print(f"Seeded demo home '{home.name}' ({home.id}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
