import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.enums import EventType
from app.models.home_event import HomeEvent


def record_event(
    db: Session,
    *,
    home_id: uuid.UUID,
    event_type: EventType,
    entity_type: str,
    entity_id: uuid.UUID | None,
    title: str,
    occurred_at: datetime,
    device_id: uuid.UUID | None = None,
    description: str | None = None,
) -> HomeEvent:
    """Append an event to the home timeline.

    The caller owns the transaction (this only adds to the session), so events
    are recorded atomically with the action that produced them.
    """
    event = HomeEvent(
        home_id=home_id,
        device_id=device_id,
        entity_type=entity_type,
        entity_id=entity_id,
        event_type=event_type.value,
        title=title,
        description=description,
        occurred_at=occurred_at,
    )
    db.add(event)
    return event
