from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Response, status, Header
from app.services.scraper_service import scrape_all_universities
from app.services.firebase_service import FirebaseService
from app.utils.auth_middleware import get_admin_user
from firebase_admin import firestore
import time
import logging
import subprocess
import os
import sys

router = APIRouter()
firebase_service = FirebaseService()
logger = logging.getLogger(__name__)

@router.get("/dashboard")
async def get_admin_dashboard(admin = Depends(get_admin_user)):
    """Get admin dashboard statistics."""
    try:
        # Count total universities
        universities = firebase_service.query_collection("universities")
        total_universities = len(universities)
        
        # Count total users
        users = firebase_service.query_collection("users")
        total_users = len(users)
        
        # Count total applications
        applications = firebase_service.query_collection("applications")
        total_applications = len(applications)
        
        # Count pending scrape jobs
        scrape_jobs = firebase_service.query_collection(
            "scrape_jobs", 
            where_field="status", 
            where_op="==", 
            where_value="pending"
        )
        pending_scrape_jobs = len(scrape_jobs)
        
        return {
            "totalUniversities": total_universities,
            "totalUsers": total_users,
            "totalApplications": total_applications,
            "pendingScrapeJobs": pending_scrape_jobs
        }
    except Exception as e:
        logger.error(f"Error getting admin dashboard: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting admin dashboard: {str(e)}")

@router.post("/scrape-jobs/batch")
async def trigger_batch_scrape(
    background_tasks: BackgroundTasks,
    admin = Depends(get_admin_user)
):
    """
    Trigger a batch scrape job for all universities.
    This will run the scraper_service.py script directly.
    """
    try:
        # Create a batch job record
        batch_job_id = str(int(time.time()))
        batch_job_data = {
            "status": "in_progress",
            "startedAt": firestore.SERVER_TIMESTAMP,
            "completedAt": None,
            "totalUniversities": 0,
            "completedUniversities": 0,
            "errorUniversities": 0,
            "createdBy": admin.get("uid", "unknown")
        }
        
        # Store the batch job record
        firebase_service.create_document("scrape_batch_jobs", batch_job_data, batch_job_id)
        
        # Get the path to the wrapper script
        wrapper_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                               "..", "scripts", "run_scraper.py")
        
        logger.info(f"Using wrapper script at: {wrapper_script_path}")
        
        # Run the script in the background
        background_tasks.add_task(run_python_script_directly, wrapper_script_path, batch_job_id)
        
        return {
            "message": "Batch scrape job started successfully",
            "batchJobId": batch_job_id,
            "status": "in_progress"
        }
    except Exception as e:
        logger.error(f"Error triggering batch scrape: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger batch scrape: {str(e)}")

@router.post("/scrape-jobs/batch-direct")
async def trigger_direct_batch_scrape(
    background_tasks: BackgroundTasks,
    api_key: str = Header(None)
):
    """
    Direct batch scrape endpoint with simplified auth for direct access.
    Uses API key authentication instead of JWT token.
    """
    # Simple API key check
    valid_key = "scraper-direct-access-key"
    
    if api_key != valid_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
        
    try:
        # Create a batch job record
        batch_job_id = str(int(time.time()))
        batch_job_data = {
            "status": "in_progress",
            "startedAt": firestore.SERVER_TIMESTAMP,
            "completedAt": None,
            "totalUniversities": 0,
            "completedUniversities": 0,
            "errorUniversities": 0,
            "createdBy": "direct-api-call"
        }
        
        # Store the batch job record
        firebase_service.create_document("scrape_batch_jobs", batch_job_data, batch_job_id)
        
        # Get the path to the wrapper script
        wrapper_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                "..", "scripts", "run_scraper.py")
        
        logger.info(f"Using wrapper script at: {wrapper_script_path}")
        
        # Run script in the background
        background_tasks.add_task(run_python_script_directly, wrapper_script_path, batch_job_id)
        
        return {
            "message": "Direct batch scrape job started successfully",
            "batchJobId": batch_job_id,
            "status": "in_progress"
        }
    except Exception as e:
        logger.error(f"Error triggering direct batch scrape: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger batch scrape: {str(e)}")

@router.get("/scrape-jobs")
async def get_scrape_jobs(admin = Depends(get_admin_user)):
    """Get all scrape jobs."""
    try:
        # Get individual scrape jobs
        scrape_jobs = firebase_service.query_collection("scrape_jobs")
        
        # Get batch scrape jobs
        batch_jobs = firebase_service.query_collection("scrape_batch_jobs")
        
        return {
            "jobs": scrape_jobs,
            "batchJobs": batch_jobs
        }
    except Exception as e:
        logger.error(f"Error getting scrape jobs: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting scrape jobs: {str(e)}")

@router.get("/applications")
async def get_applications(admin = Depends(get_admin_user)):
    """Get all applications for admin review."""
    try:
        applications = firebase_service.query_collection("applications")
        return {"applications": applications}
    except Exception as e:
        logger.error(f"Error getting applications: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting applications: {str(e)}")

@router.put("/applications/{application_id}")
async def update_application_status(
    application_id: str,
    status: str,
    notes: str = None,
    admin = Depends(get_admin_user)
):
    """Update application status."""
    try:
        # Validate status
        valid_statuses = ["pending", "under-review", "accepted", "rejected"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Update the application
        update_data = {
            "status": status,
            "updatedAt": firestore.SERVER_TIMESTAMP,
            "updatedBy": admin.get("uid", "unknown")
        }
        
        if notes:
            update_data["adminNotes"] = notes
        
        firebase_service.update_document("applications", application_id, update_data)
        
        return {"message": f"Application {application_id} updated to {status}"}
    except Exception as e:
        logger.error(f"Error updating application {application_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating application: {str(e)}")

def run_scraper_script(script_path: str, batch_job_id: str):
    """Run the scraper_service.py script directly and update job status."""
    try:
        # Run the script
        logger.info(f"Starting batch scrape job {batch_job_id} by running {script_path}")
        start_time = time.time()
        
        # Get the python executable used by the current process
        python_executable = "python"
        
        # First, run the setup script to copy Firebase credentials
        setup_script_path = os.path.join(os.path.dirname(script_path), "setup_firebase_key.py")
        logger.info(f"Running Firebase setup script: {setup_script_path}")
        
        setup_process = subprocess.Popen(
            [python_executable, setup_script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        setup_stdout, setup_stderr = setup_process.communicate()
        
        if setup_process.returncode != 0:
            logger.error(f"Firebase setup failed: {setup_stderr}")
            firebase_service.update_document("scrape_batch_jobs", batch_job_id, {
                "status": "failed",
                "error": f"Firebase setup failed: {setup_stderr}",
                "completedAt": firestore.SERVER_TIMESTAMP
            })
            return
            
        logger.info(f"Firebase setup completed: {setup_stdout}")
        
        # Now run the actual scraper script
        process = subprocess.Popen(
            [python_executable, script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for completion and capture output
        stdout, stderr = process.communicate()
        
        # Log the output
        if stdout:
            logger.info(f"Script output: {stdout}")
        if stderr:
            logger.error(f"Script errors: {stderr}")
            
        end_time = time.time()
        
        # Update the batch job record based on exit code
        if process.returncode == 0:
            # Script ran successfully
            firebase_service.update_document("scrape_batch_jobs", batch_job_id, {
                "status": "completed",
                "completedAt": firestore.SERVER_TIMESTAMP,
                "executionTimeSeconds": end_time - start_time
            })
            logger.info(f"Batch scrape job {batch_job_id} completed successfully")
        else:
            # Script failed
            firebase_service.update_document("scrape_batch_jobs", batch_job_id, {
                "status": "failed",
                "error": stderr if stderr else "Unknown error",
                "completedAt": firestore.SERVER_TIMESTAMP,
                "executionTimeSeconds": end_time - start_time
            })
            logger.error(f"Batch scrape job {batch_job_id} failed with exit code {process.returncode}")
    except Exception as e:
        logger.error(f"Error in batch scrape job {batch_job_id}: {e}")
        
        # Update the batch job record with error
        firebase_service.update_document("scrape_batch_jobs", batch_job_id, {
            "status": "failed",
            "error": str(e),
            "completedAt": firestore.SERVER_TIMESTAMP
        })

def run_python_script_directly(script_path: str, batch_job_id: str):
    """Run the Python script directly using the system's Python interpreter."""
    try:
        # Log the start of the job
        logger.info(f"Starting direct Python execution for batch job {batch_job_id}")
        start_time = time.time()
        
        # Get the path to the current Python interpreter
        python_executable = sys.executable
        
        # Use our wrapper script instead of the scraper directly
        wrapper_script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                                           "scripts", "run_scraper.py")
        
        logger.info(f"Using wrapper script at: {wrapper_script_path}")
        
        # Run script in the background
        process = subprocess.Popen(
            [python_executable, wrapper_script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # Set working directory to backend_project root
        )
        
        # Wait for completion and capture output
        stdout, stderr = process.communicate()
        
        # Log the output
        if stdout:
            logger.info(f"Script output: {stdout}")
        if stderr:
            logger.error(f"Script errors: {stderr}")
            
        end_time = time.time()
        
        # Update the batch job record based on exit code
        if process.returncode == 0:
            # Script ran successfully
            firebase_service.update_document("scrape_batch_jobs", batch_job_id, {
                "status": "completed",
                "completedAt": firestore.SERVER_TIMESTAMP,
                "executionTimeSeconds": end_time - start_time,
                "output": stdout[:500] if stdout else "No output"
            })
            logger.info(f"Direct Python execution for batch job {batch_job_id} completed successfully")
        else:
            # Script failed
            firebase_service.update_document("scrape_batch_jobs", batch_job_id, {
                "status": "failed",
                "error": stderr if stderr else "Unknown error",
                "completedAt": firestore.SERVER_TIMESTAMP,
                "executionTimeSeconds": end_time - start_time
            })
            logger.error(f"Direct Python execution for batch job {batch_job_id} failed with exit code {process.returncode}")
    except Exception as e:
        logger.error(f"Error in direct Python execution for batch job {batch_job_id}: {e}")
        
        # Update the batch job record with error
        firebase_service.update_document("scrape_batch_jobs", batch_job_id, {
            "status": "failed",
            "error": str(e),
            "completedAt": firestore.SERVER_TIMESTAMP
        }) 