import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import (
    DEFAULT_USER_DISPLAY_NAME,
    DEFAULT_USER_EMAIL,
    DEFAULT_USER_ID,
)
from app.models.base import Base
from app.models.user import User


def get_or_404(db: Session, model: type[Base], entity_id: uuid.UUID, name: str):
    """Fetch a model instance by primary key or raise a 404."""
    obj = db.get(model, entity_id)
    if obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found"
        )
    return obj


def ensure_default_user(db: Session) -> User:
    """Return the fixed Phase 1 test user, creating it if absent."""
    user = db.get(User, DEFAULT_USER_ID)
    if user is None:
        user = User(
            id=DEFAULT_USER_ID,
            email=DEFAULT_USER_EMAIL,
            display_name=DEFAULT_USER_DISPLAY_NAME,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
