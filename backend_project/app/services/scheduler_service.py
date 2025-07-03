# app/services/scheduler_service.py
from apscheduler.schedulers.background import BackgroundScheduler
import logging
import sys
import os
import importlib.util

logger = logging.getLogger(__name__)

# Create a global scheduler
scheduler = BackgroundScheduler()

def start_scheduler():
    """Start the background scheduler for periodic tasks."""
    if not scheduler.running:
        try:
            # Add admission status update job to run daily at midnight
            try:
                # First try to import the module
                scripts_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'scripts')
                status_updater_path = os.path.join(scripts_dir, 'update_admission_status.py')
                
                if os.path.exists(status_updater_path):
                    # Load the module
                    spec = importlib.util.spec_from_file_location("update_admission_status", status_updater_path)
                    status_updater = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(status_updater)
                    
                    # Add the job to run daily at midnight
                    scheduler.add_job(
                        status_updater.update_admission_status,
                        'cron',
                        hour=0,
                        minute=0,
                        id='update_admission_status',
                        replace_existing=True
                    )
                    logger.info("Added daily admission status update job to scheduler")
                else:
                    logger.warning(f"Admission status updater not found at {status_updater_path}")
            except Exception as job_error:
                logger.error(f"Failed to add admission status update job: {str(job_error)}")
            
            # Start the scheduler
            scheduler.start()
            logger.info("Background scheduler started")
            return True
        except Exception as e:
            logger.error(f"Failed to start scheduler: {str(e)}")
            return False
    return True

def add_job(func, trigger, **kwargs):
    """Add a job to the scheduler."""
    try:
        job = scheduler.add_job(func, trigger, **kwargs)
        logger.info(f"Added job '{job.id}' to scheduler")
        return job
    except Exception as e:
        logger.error(f"Failed to add job to scheduler: {str(e)}")
        return None
