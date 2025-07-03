# app/routers/university.py
from fastapi import APIRouter, HTTPException, Body, Query, Depends, status
from typing import Optional, List, Dict, Any
from app.services.firebase_service import FirebaseService
from app.models.university import UniversityData, UniversityFilter
from app.utils.auth import get_current_user, get_admin_user, User
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter()
firebase_service = FirebaseService()

# ========== NON-PARAMETERIZED ROUTES (MUST COME FIRST) ==========

@router.get("/", status_code=status.HTTP_200_OK)
async def get_universities(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),  # Reduced maximum limit from 100 to 50
    deadlineWithin: Optional[int] = Query(None, description="Filter universities with deadlines within X days"),
    sort: Optional[str] = Query(None, description="Sort by field (e.g., 'deadline')"),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get all universities with pagination."""
    try:
        if limit > 25:
            logger.warning(f"Large page size requested ({limit}). This may hit Firebase quota limits.")
            
        # Try to use cached data first
        universities = firebase_service.get_all_documents("universities")
        
        # Filter by deadline if requested
        if deadlineWithin is not None:
            try:
                today = datetime.now()
                max_date = today + timedelta(days=deadlineWithin)
                
                # Filter universities with deadlines within the specified period
                filtered_unis = []
                for uni in universities:
                    # Get deadline from direct property or from basic_info
                    deadline = uni.get("deadline")
                    if not deadline and "basic_info" in uni:
                        deadline = uni["basic_info"].get("Deadline to Apply")
                    
                    # Skip if no deadline found
                    if not deadline:
                        continue
                    
                    # Try to parse the deadline
                    try:
                        # Convert string deadline to datetime
                        deadline_date = None
                        if isinstance(deadline, str):
                            # Handle different date formats
                            formats_to_try = [
                                "%Y-%m-%d",  # ISO format
                                "%d-%m-%Y",  # DD-MM-YYYY
                                "%d %b %Y",  # DD Mon YYYY
                            ]
                            
                            for fmt in formats_to_try:
                                try:
                                    deadline_date = datetime.strptime(deadline, fmt)
                                    break
                                except ValueError:
                                    continue
                            
                            # If no format matched, try parsing as ISO
                            if not deadline_date:
                                deadline_date = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
                        
                        # Check if deadline is within range
                        if deadline_date and deadline_date >= today and deadline_date <= max_date:
                            filtered_unis.append(uni)
                    except Exception as parse_error:
                        logger.warning(f"Could not parse deadline '{deadline}' for university {uni.get('name')}: {str(parse_error)}")
                
                universities = filtered_unis
                
            except Exception as filter_error:
                logger.error(f"Error filtering by deadline: {str(filter_error)}")
                # Don't apply the filter if there's an error
        
        # Sort if requested
        if sort:
            try:
                if sort.lower() == 'deadline':
                    # Create a helper function to get deadline from university data
                    def get_deadline_date(uni):
                        deadline = uni.get("deadline")
                        if not deadline and "basic_info" in uni:
                            deadline = uni["basic_info"].get("Deadline to Apply")
                        
                        if not deadline:
                            # Return a far future date for universities without deadlines
                            return datetime.max
                        
                        try:
                            # Try different date formats
                            formats_to_try = [
                                "%Y-%m-%d",
                                "%d-%m-%Y",
                                "%d %b %Y",
                            ]
                            
                            for fmt in formats_to_try:
                                try:
                                    return datetime.strptime(deadline, fmt)
                                except ValueError:
                                    continue
                            
                            # Last resort - try ISO format
                            return datetime.fromisoformat(deadline.replace('Z', '+00:00'))
                        except:
                            # Return max date on error
                            return datetime.max
                    
                    # Sort by deadline (ascending)
                    universities = sorted(universities, key=get_deadline_date)
            except Exception as sort_error:
                logger.error(f"Error sorting: {str(sort_error)}")
                # Don't sort if there's an error
        
        # Basic pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated = universities[start_idx:end_idx] if universities else []
        
        return {
            "universities": paginated,
            "total": len(universities),
            "page": page,
            "limit": limit,
            "pages": (len(universities) + limit - 1) // limit  # Ceiling division
        }
    except Exception as e:
        logger.error(f"Error fetching universities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch universities"
        )

@router.post("/", status_code=201)
async def create_or_update_university(
    university: UniversityData = Body(...),
    user = Depends(get_admin_user)  # Only admins can create/update
):
    """Create or update a university document."""
    # Check if university with same name already exists
    existing_unis = firebase_service.find_document("universities", "name", "==", university.name)
    
    # Convert Pydantic model to dict
    uni_data = university.model_dump()
    
    # Set the timestamp for when it was last updated
    from firebase_admin import firestore
    uni_data["updated_at"] = firestore.SERVER_TIMESTAMP
    uni_data["updated_by"] = user.get("uid")
    
    if existing_unis:
        # Update existing university
        doc_id = existing_unis[0]["id"]
        firebase_service.update_document("universities", doc_id, uni_data)
        return {"message": "University updated successfully", "id": doc_id}
    else:
        # Create new university
        doc_id = firebase_service.create_document("universities", uni_data)
        return {"message": "University created successfully", "id": doc_id}

@router.get("/programs", status_code=status.HTTP_200_OK)
async def get_programs():
    """Get all available programs across universities."""
    try:
        universities = firebase_service.get_all_documents("universities")
        logger.info(f"Fetched {len(universities)} universities for programs")
        
        # Extract all unique programs
        all_programs = set()
        
        for uni in universities:
            programs = uni.get("programs", {})
            
            # Skip if programs is not a dictionary
            if not isinstance(programs, dict):
                continue
            
            for category, program_list in programs.items():
                # Skip if program_list is not a list
                if not isinstance(program_list, list):
                    continue
                
                for program in program_list:
                    # Skip if program is not a string
                    if not isinstance(program, str):
                        continue
                        
                    # Clean program name (remove numbers, etc.)
                    cleaned_program = program
                    if "." in program and program.split(".", 1)[0].strip().isdigit():
                        cleaned_program = program.split(".", 1)[1].strip()
                    
                    # Add the cleaned program name
                    all_programs.add(cleaned_program)
        
        result = sorted(list(all_programs))
        logger.info(f"Successfully extracted {len(result)} unique programs")
        return result
    except Exception as e:
        logger.error(f"Error fetching programs: {str(e)}")
        # Return default programs as fallback
        return [
            "Computer Science", 
            "Engineering",
            "Business Administration",
            "Medicine",
            "Law",
            "Arts & Humanities",
            "Social Sciences",
            "Natural Sciences"
        ]

@router.get("/locations", status_code=status.HTTP_200_OK)
async def get_locations():
    """Get all available university locations."""
    try:
        universities = firebase_service.get_all_documents("universities")
        
        # Extract all unique locations
        locations = set()
        for uni in universities:
            location = uni.get("basic_info", {}).get("Location")
            if location:
                # Clean and normalize location
                locations.add(location.strip())
        
        return sorted(list(locations))
    except Exception as e:
        logger.error(f"Error fetching locations: {str(e)}")
        # Return default locations as fallback
        return [
            "Islamabad",
            "Lahore",
            "Karachi",
            "Peshawar",
            "Quetta",
            "Faisalabad"
        ]

@router.post("/search", status_code=status.HTTP_200_OK)
async def search_universities(
    search_data: Dict[str, Any],
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Advanced search for universities with multiple criteria.
    """
    try:
        universities = firebase_service.get_all_documents("universities")
        
        # Extract search criteria
        query = search_data.get("query", "").lower()
        filters = search_data.get("filters", {})
        
        # Filter universities
        filtered = []
        for uni in universities:
            # Basic name search
            name = uni.get("name", "").lower()
            if query and query not in name:
                continue
            
            # Additional filters could be applied here
            
            filtered.append(uni)
        
        return filtered
    except Exception as e:
        logger.error(f"Error searching universities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching universities"
        )

# ========== PARAMETERIZED ROUTES (MUST COME AFTER) ==========

@router.get("/{university_id}", status_code=status.HTTP_200_OK)
async def get_university(
    university_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get details for a specific university."""
    try:
        university = firebase_service.get_document("universities", university_id)
        if not university:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"University with ID {university_id} not found"
            )
        # Add ID to the response
        university["id"] = university_id
        return university
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching university {university_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch university with ID {university_id}"
        )

@router.delete("/{univ_id}")
async def delete_university(
    univ_id: str,
    user = Depends(get_admin_user)  # Only admins can delete
):
    """Delete a university document."""
    # Check if university exists
    uni = firebase_service.get_document("universities", univ_id)
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")
    
    # Delete the university
    firebase_service.delete_document("universities", univ_id)
    return {"message": "University deleted successfully"}

# New endpoints for university-specific data

@router.get("/{university_id}/programs", status_code=status.HTTP_200_OK)
async def get_university_programs(
    university_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get programs for a specific university."""
    try:
        university = firebase_service.get_document("universities", university_id)
        if not university:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"University with ID {university_id} not found"
            )
        
        # Extract programs from university data
        programs = []
        programs_data = university.get("programs", {})
        
        # Convert nested program structure to flat list with categories
        for category, prog_list in programs_data.items():
            for program in prog_list:
                # Clean program name if it has a number prefix (e.g., "1. Computer Science")
                program_name = program
                if "." in program and program.split(".", 1)[0].strip().isdigit():
                    program_name = program.split(".", 1)[1].strip()
                
                programs.append({
                    "name": program_name,
                    "category": category,
                    "id": f"{category.lower()}-{program_name.lower().replace(' ', '-')}"
                })
        
        return {"programs": programs}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching programs for university {university_id}: {str(e)}")
        # Return empty array as fallback
        return {"programs": []}

@router.get("/{university_id}/admissions", status_code=status.HTTP_200_OK)
async def get_university_admissions(
    university_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get admissions information for a specific university."""
    try:
        university = firebase_service.get_document("universities", university_id)
        if not university:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"University with ID {university_id} not found"
            )
        
        # Get admissions info from university data
        # This could be stored in different ways depending on your data model
        admissions = []
        admissions_data = university.get("admissions", {})
        
        # If admissions is a dictionary with sections
        for section, details in admissions_data.items():
            admissions.append({
                "section": section,
                "details": details
            })
        
        # If no structured admissions data, try to get from basic_info
        if not admissions and "basic_info" in university:
            basic_info = university["basic_info"]
            admission_keys = ["Admission", "Admissions", "Entry Test", "Application Process"]
            
            for key, value in basic_info.items():
                if any(admission_key in key for admission_key in admission_keys):
                    admissions.append({
                        "section": key,
                        "details": value
                    })
        
        return {"admissions": admissions}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching admissions for university {university_id}: {str(e)}")
        # Return empty array as fallback
        return {"admissions": []}

@router.get("/{university_id}/scholarships", status_code=status.HTTP_200_OK)
async def get_university_scholarships(
    university_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get scholarship information for a specific university."""
    try:
        university = firebase_service.get_document("universities", university_id)
        if not university:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"University with ID {university_id} not found"
            )
        
        # Get scholarships info from university data
        scholarships = []
        scholarships_data = university.get("scholarships", [])
        
        # If scholarships is already an array, use it directly
        if isinstance(scholarships_data, list):
            scholarships = scholarships_data
        # If scholarships is a dictionary, convert to array
        elif isinstance(scholarships_data, dict):
            for name, details in scholarships_data.items():
                scholarship = {"name": name}
                if isinstance(details, dict):
                    scholarship.update(details)
                else:
                    scholarship["details"] = details
                scholarships.append(scholarship)
        
        # If no structured scholarship data, try to get from basic_info
        if not scholarships and "basic_info" in university:
            basic_info = university["basic_info"]
            scholarship_keys = ["Scholarship", "Financial Aid", "Fee Concession"]
            
            for key, value in basic_info.items():
                if any(scholarship_key in key for scholarship_key in scholarship_keys):
                    scholarships.append({
                        "name": key,
                        "details": value
                    })
        
        return {"scholarships": scholarships}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching scholarships for university {university_id}: {str(e)}")
        # Return empty array as fallback
        return {"scholarships": []}

@router.get("/{university_id}/facilities", status_code=status.HTTP_200_OK)
async def get_university_facilities(
    university_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get facilities information for a specific university."""
    try:
        university = firebase_service.get_document("universities", university_id)
        if not university:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"University with ID {university_id} not found"
            )
        
        # Get facilities info from university data
        facilities = []
        facilities_data = university.get("facilities", [])
        
        # If facilities is already an array, use it directly
        if isinstance(facilities_data, list):
            facilities = facilities_data
        # If facilities is a dictionary, convert to array
        elif isinstance(facilities_data, dict):
            for name, details in facilities_data.items():
                facility = {"name": name}
                if isinstance(details, dict):
                    facility.update(details)
                else:
                    facility["details"] = details
                facilities.append(facility)
        
        # If no structured facilities data, try to get from basic_info
        if not facilities and "basic_info" in university:
            basic_info = university["basic_info"]
            facility_keys = ["Facilities", "Campus", "Library", "Labs", "Hostel", "Sports"]
            
            for key, value in basic_info.items():
                if any(facility_key in key for facility_key in facility_keys):
                    facilities.append({
                        "name": key,
                        "details": value
                    })
        
        return {"facilities": facilities}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching facilities for university {university_id}: {str(e)}")
        # Return empty array as fallback
        return {"facilities": []}
