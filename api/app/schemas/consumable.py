import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ConsumableCreate(BaseModel):
    name: str
    category: str | None = None
    sku: str | None = None
    brand: str | None = None
    size: str | None = None
    quantity_on_hand: int = Field(default=0, ge=0)
    reorder_threshold: int = Field(default=0, ge=0)
    preferred_vendor: str | None = None
    reorder_url: str | None = None
    notes: str | None = None


class ConsumableUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    sku: str | None = None
    brand: str | None = None
    size: str | None = None
    quantity_on_hand: int | None = Field(default=None, ge=0)
    reorder_threshold: int | None = Field(default=None, ge=0)
    preferred_vendor: str | None = None
    reorder_url: str | None = None
    notes: str | None = None


class ConsumableRead(ORMModel):
    id: uuid.UUID
    home_id: uuid.UUID
    name: str
    category: str | None
    sku: str | None
    brand: str | None
    size: str | None
    quantity_on_hand: int
    reorder_threshold: int
    preferred_vendor: str | None
    reorder_url: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class TaskConsumableCreate(BaseModel):
    consumable_id: uuid.UUID
    quantity_required: int = Field(default=1, ge=1)


class TaskConsumableRead(ORMModel):
    id: uuid.UUID
    task_id: uuid.UUID
    consumable_id: uuid.UUID
    quantity_required: int
    consumable: ConsumableRead
