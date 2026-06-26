from fastapi import Depends, FastAPI

from app.core.config import settings
from app.core.security import require_api_key
from app.routers import (
    activity,
    areas,
    consumables,
    dashboard,
    devices,
    homes,
    logs,
    rooms,
    tasks,
)

app = FastAPI(title=settings.app_name)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "app_name": settings.app_name,
    }


# /health stays open (used by host health checks); all data routes require the
# API key when one is configured.
_auth = [Depends(require_api_key)]
app.include_router(homes.router, dependencies=_auth)
app.include_router(areas.router, dependencies=_auth)
app.include_router(rooms.router, dependencies=_auth)
app.include_router(devices.router, dependencies=_auth)
app.include_router(tasks.router, dependencies=_auth)
app.include_router(logs.router, dependencies=_auth)
app.include_router(consumables.router, dependencies=_auth)
app.include_router(activity.router, dependencies=_auth)
app.include_router(dashboard.router, dependencies=_auth)
