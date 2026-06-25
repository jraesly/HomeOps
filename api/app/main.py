from fastapi import FastAPI

from app.core.config import settings
from app.routers import (
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


app.include_router(homes.router)
app.include_router(areas.router)
app.include_router(rooms.router)
app.include_router(devices.router)
app.include_router(tasks.router)
app.include_router(logs.router)
app.include_router(consumables.router)
app.include_router(dashboard.router)
