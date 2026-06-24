from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    """Base schema for read models loaded from SQLAlchemy objects."""

    model_config = ConfigDict(from_attributes=True)
