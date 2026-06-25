import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.area import Area
from app.models.home import Home
from app.models.room import Room
from app.routers.deps import get_or_404
from app.schemas.room import RoomCreate, RoomRead, RoomUpdate

router = APIRouter(tags=["rooms"])


def _validate_area(db: Session, home_id: uuid.UUID, area_id: uuid.UUID | None) -> None:
    if area_id is None:
        return
    area = get_or_404(db, Area, area_id, "Area")
    if area.home_id != home_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Area belongs to a different home",
        )


@router.post(
    "/homes/{home_id}/rooms",
    response_model=RoomRead,
    status_code=status.HTTP_201_CREATED,
)
def create_room(
    home_id: uuid.UUID, payload: RoomCreate, db: Session = Depends(get_db)
) -> Room:
    get_or_404(db, Home, home_id, "Home")
    _validate_area(db, home_id, payload.area_id)
    room = Room(home_id=home_id, **payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.get("/homes/{home_id}/rooms", response_model=list[RoomRead])
def list_rooms(home_id: uuid.UUID, db: Session = Depends(get_db)) -> list[Room]:
    get_or_404(db, Home, home_id, "Home")
    return list(
        db.scalars(
            select(Room).where(Room.home_id == home_id).order_by(Room.name)
        ).all()
    )


@router.get("/rooms/{room_id}", response_model=RoomRead)
def get_room(room_id: uuid.UUID, db: Session = Depends(get_db)) -> Room:
    return get_or_404(db, Room, room_id, "Room")


@router.patch("/rooms/{room_id}", response_model=RoomRead)
def update_room(
    room_id: uuid.UUID, payload: RoomUpdate, db: Session = Depends(get_db)
) -> Room:
    room = get_or_404(db, Room, room_id, "Room")
    data = payload.model_dump(exclude_unset=True)
    if "area_id" in data:
        _validate_area(db, room.home_id, data["area_id"])
    for field, value in data.items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return room


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    room = get_or_404(db, Room, room_id, "Room")
    db.delete(room)
    db.commit()
