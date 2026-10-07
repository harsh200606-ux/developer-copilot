from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    repository_url: str = ""
    language: str = "Python"


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    repository_url: str | None = None
    language: str | None = None
    status: Literal[
        "created",
        "analyzing",
        "completed",
        "failed",
    ] | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    repository_url: str
    language: str
    status: Literal[
        "created",
        "analyzing",
        "completed",
        "failed",
    ]
    created_at: datetime
    updated_at: datetime