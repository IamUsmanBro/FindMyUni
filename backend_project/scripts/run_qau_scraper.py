#!/usr/bin/env python
"""
QAU Scraper Runner Script

This script runs the QAU scraper and stores the data in Firestore.
It can be run directly from the command line.
"""

import os
import sys
import logging
import firebase_admin
from firebase_admin import credentials, firestore
import time

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("qau_scraper_runner")

def initialize_firebase():
    """Initialize Firebase with credentials from a service account file."""
    try:
        # Search in multiple locations for the credentials file
        possible_paths = [
            # Current directory
            "firebase_key.json",
            "firebase-service-account.json",
            # Parent directory
            os.path.join("..", "firebase-service-account.json"),
            # App directory
            os.path.join("..", "app", "services", "firebase_key.json"),
            # Absolute paths
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                        "firebase-service-account.json"),
            "C:/Users/Usman/Desktop/Project/NEwith modules/NE/backend_project/firebase-service-account.json"
        ]
        
        # Try each path until we find a valid one
        cred_file = None
        for path in possible_paths:
            if os.path.exists(path):
                cred_file = path
                break
                
        if cred_file:
            # Initialize with the found credentials file
            logger.info(f"Initializing Firebase with credentials from: {cred_file}")
            cred = credentials.Certificate(cred_file)
            firebase_admin.initialize_app(cred)
            return firestore.client()
        else:
            logger.error("Could not find Firebase credentials file")
            return None
            
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        return None

def main():
    """Main function to run the QAU scraper."""
    logger.info("Starting QAU scraper runner")
    
    # Import the QAU scraper module
    try:
        from app.services.qau_scraper import scrape_qau_university, store_qau_in_firestore
    except ImportError:
        logger.error("Failed to import QAU scraper. Make sure you're running from the project root.")
        return 1
    
    # Initialize Firebase
    db = initialize_firebase()
    if not db:
        logger.error("Failed to initialize Firebase. Exiting.")
        return 1
    
    # Run the scraper
    try:
        logger.info("Starting QAU scraping process...")
        start_time = time.time()
        
        # Run the scraper
        qau_data = scrape_qau_university()
        
        if qau_data:
            # Store in Firestore
            doc_id = store_qau_in_firestore(db, qau_data)
            
            if doc_id:
                end_time = time.time()
                logger.info(f"QAU scraping completed successfully in {end_time - start_time:.2f} seconds")
                logger.info(f"Data stored in Firestore with ID: {doc_id}")
                
                # Add the task record
                task_id = f"qau-{int(time.time())}"
                task_data = {
                    "status": "completed",
                    "started_at": firestore.SERVER_TIMESTAMP,
                    "completed_at": firestore.SERVER_TIMESTAMP,
                    "universities_scraped": 1,
                    "execution_time_seconds": end_time - start_time,
                    "university": "Quaid-i-Azam University (QAU)",
                    "university_id": doc_id,
                    "triggered_by": "command_line"
                }
                
                db.collection("scrape_tasks").document(task_id).set(task_data)
                logger.info(f"Created scrape task record with ID: {task_id}")
                
                return 0
            else:
                logger.error("Failed to store QAU data in Firestore")
                return 1
        else:
            logger.error("Failed to scrape QAU data")
            return 1
            
    except Exception as e:
        logger.error(f"Error during QAU scraping: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())