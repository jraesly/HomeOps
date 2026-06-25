from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base, Consumable, Device, MaintenanceTask, Room
from app.seed import seed_demo_home


def _session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _fk(dbapi_connection, _record):
        cur = dbapi_connection.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def test_seed_demo_home_populates_data() -> None:
    db = _session()
    home = seed_demo_home(db)

    assert home.name == "Davidsonville House"
    assert len(db.scalars(select(Room).where(Room.home_id == home.id)).all()) == 4
    assert (
        len(db.scalars(select(Device).where(Device.home_id == home.id)).all())
        == 4
    )
    assert (
        len(
            db.scalars(
                select(MaintenanceTask).where(MaintenanceTask.home_id == home.id)
            ).all()
        )
        == 4
    )
    assert (
        len(
            db.scalars(
                select(Consumable).where(Consumable.home_id == home.id)
            ).all()
        )
        == 2
    )
