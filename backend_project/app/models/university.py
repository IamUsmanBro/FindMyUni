# app/models/university.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class UniversityBasicInfo(BaseModel):
    key: str
    value: str

class UniversityData(BaseModel):
    name: str
    basic_info: Dict[str, str]
    description: str
    programs: Dict[str, List[str]]
    apply_link: str
    url: str

class UniversityFilter(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    program_categories: Optional[List[str]] = None
    programs: Optional[List[str]] = None
    page: Optional[int] = Field(1, ge=1, description="Page number")
    limit: Optional[int] = Field(10, ge=1, le=100, description="Items per page")

class UniversityResponse(BaseModel):
    id: str
    name: str
    basic_info: Dict[str, str]
    description: str
    programs: Dict[str, List[str]]
    apply_link: str
    url: str
    updated_at: Optional[str] = None
