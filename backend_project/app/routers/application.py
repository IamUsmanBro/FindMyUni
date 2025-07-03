# app/routers/application.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from app.services.firebase_service import FirebaseService
from app.models.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse, ApplicationStatus
from app.utils.auth_middleware import get_current_user
import logging

router = APIRouter()
firebase_service = FirebaseService()
logger = logging.getLogger(__name__)

@router.post("/", response_model=ApplicationResponse, status_code=201)
async def create_application(
    application: ApplicationCreate, 
    user = Depends(get_current_user)
):
    """Create a new university application."""
    # Get university name for reference
    university = firebase_service.get_document("universities", application.university_id)
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    
    # Prepare application data
    application_data = application.model_dump()
    application_data["user_id"] = user.get("uid")
    application_data["university_name"] = university.get("name")
    application_data["status"] = ApplicationStatus.DRAFT.value
    application_data["created_at"] = firebase_service.get_server_timestamp()
    application_data["updated_at"] = firebase_service.get_server_timestamp()
    
    # Create application in Firestore
    try:
        app_id = firebase_service.create_document("applications", application_data)
        # Add ID to the response
        application_data["id"] = app_id
        return application_data
    except Exception as e:
        logger.error(f"Error creating application: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create application")

@router.get("/", response_model=List[ApplicationResponse])
async def get_my_applications(
    user = Depends(get_current_user),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by application status")
):
    """Get all applications for the current user."""
    try:
        # First get applications by user ID
        applications = firebase_service.find_document("applications", "user_id", "==", user.get("uid"))
        
        # Apply status filter if provided
        if status:
            applications = [app for app in applications if app.get("status") == status]
        
        return applications
    except Exception as e:
        logger.error(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve applications")

@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: str = Path(..., description="The ID of the application to retrieve"),
    user = Depends(get_current_user)
):
    """Get a specific application by ID."""
    try:
        # Get the application
        application = firebase_service.get_document("applications", application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Check if the application belongs to the current user
        if application.get("user_id") != user.get("uid"):
            raise HTTPException(status_code=403, detail="You do not have permission to access this application")
        
        # Add ID to the response
        application["id"] = application_id
        return application
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching application {application_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve application")

@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application: ApplicationUpdate,
    application_id: str = Path(..., description="The ID of the application to update"),
    user = Depends(get_current_user)
):
    """Update an existing application."""
    try:
        # Get the application
        existing_app = firebase_service.get_document("applications", application_id)
        if not existing_app:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Check if the application belongs to the current user
        if existing_app.get("user_id") != user.get("uid"):
            raise HTTPException(status_code=403, detail="You do not have permission to update this application")
        
        # Update only provided fields
        update_data = {k: v for k, v in application.model_dump().items() if v is not None}
        update_data["updated_at"] = firebase_service.get_server_timestamp()
        
        # Update the application
        firebase_service.update_document("applications", application_id, update_data)
        
        # Get the updated application
        updated_app = firebase_service.get_document("applications", application_id)
        updated_app["id"] = application_id
        return updated_app
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating application {application_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update application")

@router.delete("/{application_id}", status_code=204)
async def delete_application(
    application_id: str = Path(..., description="The ID of the application to delete"),
    user = Depends(get_current_user)
):
    """Delete an application."""
    try:
        # Get the application
        application = firebase_service.get_document("applications", application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Check if the application belongs to the current user
        if application.get("user_id") != user.get("uid"):
            raise HTTPException(status_code=403, detail="You do not have permission to delete this application")
        
        # Delete the application
        firebase_service.delete_document("applications", application_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting application {application_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete application")
