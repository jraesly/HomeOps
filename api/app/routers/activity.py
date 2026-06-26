import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.device import Device
from app.models.home import Home
from app.models.home_event import HomeEvent
from app.routers.deps import get_or_404
from app.schemas.activity import HomeEventRead, SearchResults
from app.services.search_service import search_home

router = APIRouter(tags=["activity"])

TIMELINE_LIMIT = 100


@router.get("/homes/{home_id}/timeline", response_model=list[HomeEventRead])
def get_home_timeline(
    home_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[HomeEvent]:
    get_or_404(db, Home, home_id, "Home")
    return list(
        db.scalars(
            select(HomeEvent)
            .where(HomeEvent.home_id == home_id)
            .order_by(HomeEvent.occurred_at.desc())
            .limit(TIMELINE_LIMIT)
        ).all()
    )


@router.get("/devices/{device_id}/timeline", response_model=list[HomeEventRead])
def get_device_timeline(
    device_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[HomeEvent]:
    get_or_404(db, Device, device_id, "Device")
    return list(
        db.scalars(
            select(HomeEvent)
            .where(HomeEvent.device_id == device_id)
            .order_by(HomeEvent.occurred_at.desc())
            .limit(TIMELINE_LIMIT)
        ).all()
    )


@router.get("/homes/{home_id}/search", response_model=SearchResults)
def search(
    home_id: uuid.UUID,
    q: str = Query(min_length=1),
    db: Session = Depends(get_db),
) -> SearchResults:
    get_or_404(db, Home, home_id, "Home")
    results = search_home(db, home_id, q.strip())
    return SearchResults(query=q, **results)
