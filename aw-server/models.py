from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DataTransmissionType(str, Enum):
    RAW = "raw"
    ENCRYPTED_AI = "encrypted_ai"
    ENCRYPTED_NO_AI = "encrypted_no_ai"

class ActivityEvent(BaseModel):
    id: Optional[str] = None
    timestamp_start: str = Field(..., description="Activity start time in ISO format")
    timestamp_end: str = Field(..., description="Activity end time in ISO format")
    duration_sec: int = Field(..., gt=0, description="Duration in seconds")
    app: str = Field(..., min_length=1, description="Application name")
    title: str = Field(..., min_length=1, description="Window title")
    category: str = Field(..., min_length=1, description="Activity category")
    window_change_count: int = Field(default=0, ge=0, description="Number of window changes")
    input_frequency: float = Field(default=0.0, ge=0.0, le=1.0, description="Input frequency (0-1)")
    is_afk: bool = Field(default=False, description="Is away from keyboard")
    url: Optional[str] = None
    user_id: str = Field(..., min_length=1, description="User ID")

    @validator('timestamp_start', 'timestamp_end')
    def validate_timestamps(cls, v):
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError('Timestamps must be in ISO format')

class User(BaseModel):
    id: str = Field(..., min_length=1, description="User ID")
    email: str = Field(..., description="User email")
    display_name: Optional[str] = Field(None, description="Display name")
    preferences: Optional[Dict[str, Any]] = Field(default_factory=dict, description="User preferences")

class Bucket(BaseModel):
    id: str = Field(..., min_length=1, description="Bucket ID")
    type: str = Field(..., min_length=1, description="Bucket type")
    client: str = Field(..., min_length=1, description="Client name")
    hostname: str = Field(..., min_length=1, description="Hostname")
    user_id: str = Field(..., min_length=1, description="User ID")

class Event(BaseModel):
    id: Optional[str] = None
    timestamp: str = Field(..., description="Event timestamp in ISO format")
    duration: int = Field(..., gt=0, description="Duration in seconds")
    data: Dict[str, Any] = Field(default_factory=dict, description="Event data")
    bucket_id: str = Field(..., min_length=1, description="Bucket ID")
    user_id: str = Field(..., min_length=1, description="User ID")

    @validator('timestamp')
    def validate_timestamp(cls, v):
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError('Timestamp must be in ISO format')
