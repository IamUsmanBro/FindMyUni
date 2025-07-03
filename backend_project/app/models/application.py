# app/models/application.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum

class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WAITLISTED = "waitlisted"

class ApplicationCreate(BaseModel):
    university_id: str
    program: str
    notes: Optional[str] = None
    documents: Optional[Dict[str, str]] = None
    deadline: Optional[str] = None

class ApplicationUpdate(BaseModel):
    program: Optional[str] = None
    notes: Optional[str] = None
    documents: Optional[Dict[str, str]] = None
    status: Optional[ApplicationStatus] = None
    deadline: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    university_id: str
    university_name: Optional[str] = None
    program: str
    notes: Optional[str] = None
    documents: Optional[Dict[str, str]] = {}
    status: ApplicationStatus
    deadline: Optional[str] = None
    created_at: Any
    updated_at: Any
