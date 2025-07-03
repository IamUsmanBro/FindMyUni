# app/routers/scraper.py
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from app.services.scraper_service import scrape_all_universities
from app.services.qau_scraper import scrape_qau_university, store_qau_in_firestore
from app.services.firebase_service import FirebaseService
from app.utils.auth_middleware import get_admin_user
from firebase_admin import firestore
import time
import logging

router = APIRouter()
firebase_service = FirebaseService()
logger = logging.getLogger(__name__)

@router.post("/")
async def trigger_scraper(
    background_tasks: BackgroundTasks,
    admin = Depends(get_admin_user)  # Only admins can trigger scraping
):
    """
    Trigger the scraping process to run in the background.
    Returns a task ID that can be used to check the status.
    """
    # Create a new scrape task record in Firebase
    task_id = str(int(time.time()))
    task_data = {
        "status": "started",
        "started_at": firestore.SERVER_TIMESTAMP,
        "completed_at": None,
        "universities_scraped": 0,
        "triggered_by": admin.get("uid")
    }
    
    firebase_service.create_document("scrape_tasks", task_data, task_id)
    
    # Run the scraping process in the background
    background_tasks.add_task(run_scraper, task_id)
    
    return {"message": "Scraping task started", "task_id": task_id}

@router.get("/{task_id}")
async def get_scrape_task_status(
    task_id: str,
    admin = Depends(get_admin_user)  # Only admins can check task status
):
    """Get the status of a scraping task."""
    task = firebase_service.get_document("scrape_tasks", task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Scrape task not found")
    return task

@router.get("/")
async def get_all_scrape_tasks(
    admin = Depends(get_admin_user)  # Only admins can get all tasks
):
    """Get all scraping tasks."""
    tasks = firebase_service.query_collection("scrape_tasks")
    return {"tasks": tasks}

def run_scraper(task_id: str):
    """Run the scraper and update the task status."""
    try:
        # Run the scraper
        start_time = time.time()
        universities = scrape_all_universities()
        end_time = time.time()
        
        # Update the task status to completed
        firebase_service.update_document("scrape_tasks", task_id, {
            "status": "completed",
            "completed_at": firestore.SERVER_TIMESTAMP,
            "universities_scraped": len(universities),
            "execution_time_seconds": end_time - start_time
        })
    except Exception as e:
        # Update the task status to failed
        firebase_service.update_document("scrape_tasks", task_id, {
            "status": "failed",
            "error": str(e),
            "completed_at": firestore.SERVER_TIMESTAMP
        }) 

@router.post("/qau")
async def trigger_qau_scraper(
    background_tasks: BackgroundTasks
):
    """
    Trigger the QAU-specific scraping process to run in the background.
    Returns a task ID that can be used to check the status.
    """
    # Create a new scrape task record in Firebase
    task_id = f"qau-{int(time.time())}"
    task_data = {
        "status": "started",
        "started_at": firestore.SERVER_TIMESTAMP,
        "completed_at": None,
        "universities_scraped": 0,
        "triggered_by": "web_interface",
        "university": "Quaid-i-Azam University (QAU)"
    }
    
    firebase_service.create_document("scrape_tasks", task_data, task_id)
    
    # Run the QAU scraping process in the background
    background_tasks.add_task(run_qau_scraper, task_id)
    
    return {"message": "QAU scraping task started", "task_id": task_id}

def run_qau_scraper(task_id: str):
    """Run the QAU scraper and update the task status."""
    try:
        # Run the scraper
        start_time = time.time()
        qau_data = scrape_qau_university()
        
        if qau_data:
            # Store in Firestore
            db = firestore.client()
            doc_id = store_qau_in_firestore(db, qau_data)
            
            # Update task status
            end_time = time.time()
            firebase_service.update_document("scrape_tasks", task_id, {
                "status": "completed",
                "completed_at": firestore.SERVER_TIMESTAMP,
                "universities_scraped": 1,
                "execution_time_seconds": end_time - start_time,
                "university_id": doc_id
            })
            logger.info(f"QAU scraper task {task_id} completed successfully")
        else:
            # Update task status to failed
            firebase_service.update_document("scrape_tasks", task_id, {
                "status": "failed",
                "error": "Failed to scrape QAU data",
                "completed_at": firestore.SERVER_TIMESTAMP
            })
            logger.error(f"QAU scraper task {task_id} failed to retrieve data")
    except Exception as e:
        # Update the task status to failed
        firebase_service.update_document("scrape_tasks", task_id, {
            "status": "failed",
            "error": str(e),
            "completed_at": firestore.SERVER_TIMESTAMP
        })
        logger.error(f"Error in QAU scraper task {task_id}: {e}")

# Add a new public endpoint with no auth middleware
@router.post("/qau-direct")
async def trigger_qau_scraper_direct(
    background_tasks: BackgroundTasks
):
    """
    Public endpoint to trigger QAU scraping with no authentication required.
    """
    logger.info("Direct QAU scraping triggered")
    # Create a new scrape task record in Firebase
    task_id = f"qau-direct-{int(time.time())}"
    task_data = {
        "status": "started",
        "started_at": firestore.SERVER_TIMESTAMP,
        "completed_at": None,
        "universities_scraped": 0,
        "triggered_by": "direct_public_access",
        "university": "Quaid-i-Azam University (QAU)"
    }
    
    firebase_service.create_document("scrape_tasks", task_data, task_id)
    
    # Run the QAU scraping process in the background
    background_tasks.add_task(run_qau_scraper, task_id)
    
    return {"message": "QAU scraping task started", "task_id": task_id}