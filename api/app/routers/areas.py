import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.area import Area
from app.models.home import Home
from app.routers.deps import get_or_404
from app.schemas.area import AreaCreate, AreaRead, AreaUpdate

router = APIRouter(tags=["areas"])


@router.post(
    "/homes/{home_id}/areas",
    response_model=AreaRead,
    status_code=status.HTTP_201_CREATED,
)
def create_area(
    home_id: uuid.UUID, payload: AreaCreate, db: Session = Depends(get_db)
) -> Area:
    get_or_404(db, Home, home_id, "Home")
    area = Area(home_id=home_id, **payload.model_dump())
    db.add(area)
    db.commit()
    db.refresh(area)
    return area


@router.get("/homes/{home_id}/areas", response_model=list[AreaRead])
def list_areas(home_id: uuid.UUID, db: Session = Depends(get_db)) -> list[Area]:
    get_or_404(db, Home, home_id, "Home")
    return list(
        db.scalars(
            select(Area)
            .where(Area.home_id == home_id)
            .order_by(Area.sort_order, Area.name)
        ).all()
    )


@router.patch("/areas/{area_id}", response_model=AreaRead)
def update_area(
    area_id: uuid.UUID, payload: AreaUpdate, db: Session = Depends(get_db)
) -> Area:
    area = get_or_404(db, Area, area_id, "Area")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(area, field, value)
    db.commit()
    db.refresh(area)
    return area


@router.delete("/areas/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_area(area_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    area = get_or_404(db, Area, area_id, "Area")
    db.delete(area)
    db.commit()
