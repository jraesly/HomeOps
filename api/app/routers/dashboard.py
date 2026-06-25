import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.home import Home
from app.routers.deps import get_or_404
from app.schemas.dashboard import Dashboard
from app.services.dashboard_service import build_dashboard

router = APIRouter(tags=["dashboard"])


@router.get("/homes/{home_id}/dashboard", response_model=Dashboard)
def get_dashboard(home_id: uuid.UUID, db: Session = Depends(get_db)) -> Dashboard:
    home = get_or_404(db, Home, home_id, "Home")
    return build_dashboard(db, home)
