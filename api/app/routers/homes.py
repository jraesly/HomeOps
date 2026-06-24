import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.home import Home
from app.routers.deps import ensure_default_user, get_or_404
from app.schemas.home import HomeCreate, HomeRead, HomeUpdate

router = APIRouter(tags=["homes"])


@router.post("/homes", response_model=HomeRead, status_code=status.HTTP_201_CREATED)
def create_home(payload: HomeCreate, db: Session = Depends(get_db)) -> Home:
    user = ensure_default_user(db)
    home = Home(user_id=user.id, **payload.model_dump())
    db.add(home)
    db.commit()
    db.refresh(home)
    return home


@router.get("/homes", response_model=list[HomeRead])
def list_homes(db: Session = Depends(get_db)) -> list[Home]:
    return list(db.scalars(select(Home).order_by(Home.created_at)).all())


@router.get("/homes/{home_id}", response_model=HomeRead)
def get_home(home_id: uuid.UUID, db: Session = Depends(get_db)) -> Home:
    return get_or_404(db, Home, home_id, "Home")


@router.patch("/homes/{home_id}", response_model=HomeRead)
def update_home(
    home_id: uuid.UUID, payload: HomeUpdate, db: Session = Depends(get_db)
) -> Home:
    home = get_or_404(db, Home, home_id, "Home")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(home, field, value)
    db.commit()
    db.refresh(home)
    return home


@router.delete("/homes/{home_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_home(home_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    home = get_or_404(db, Home, home_id, "Home")
    db.delete(home)
    db.commit()
