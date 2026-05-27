from app.core.config import settings
from fastapi import FastAPI

app = FastAPI(title=settings.app_name)

@app.get("/health")
async def health_check() -> dict[str, str]:
    return {
                "status": "ok",
                "environment": settings.environment,
                "app_name": settings.app_name
            }