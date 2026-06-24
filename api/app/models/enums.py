from enum import Enum


class DeviceType(str, Enum):
    hvac = "HVAC"
    water_treatment = "Water Treatment"
    appliance = "Appliance"
    plumbing = "Plumbing"
    electrical = "Electrical"
    exterior = "Exterior"
    garden = "Garden"
    safety = "Safety"
    network = "Network"
    other = "Other"


class DeviceStatus(str, Enum):
    active = "active"
    watching = "watching"
    needs_service = "needs_service"
    retired = "retired"


class TaskType(str, Enum):
    replace_filter = "replace_filter"
    inspect = "inspect"
    clean = "clean"
    test = "test"
    service = "service"
    refill = "refill"
    winterize = "winterize"
    other = "other"


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class RecurrenceType(str, Enum):
    none = "none"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"
    seasonal = "seasonal"
    custom_days = "custom_days"


class TaskStatus(str, Enum):
    active = "active"
    paused = "paused"
    completed_once = "completed_once"
    archived = "archived"
