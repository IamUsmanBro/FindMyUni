#!/usr/bin/env python
"""
Admission Status Updater

This script automatically updates the admissionOpen flag for all universities
based on their application deadlines.
"""

import os
import sys
import logging
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("admission_status_updater")

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

def update_admission_status():
    """
    Update the admissionOpen flag for all universities based on their deadlines.
    """
    # Initialize Firebase
    db = initialize_firebase()
    if not db:
        logger.error("Failed to initialize Firebase. Exiting.")
        return 1
    
    logger.info("Starting admission status update process")
    current_date = datetime.now()
    logger.info(f"Current date: {current_date.strftime('%Y-%m-%d')}")
    
    # Get all universities from Firestore
    universities_ref = db.collection("universities")
    universities = universities_ref.get()
    
    updated_count = 0
    error_count = 0
    skipped_count = 0
    
    for uni in universities:
        uni_data = uni.to_dict()
        uni_id = uni.id
        uni_name = uni_data.get("name", "Unknown University")
        
        try:
            # Get the deadline from basic_info
            deadline_str = uni_data.get("basic_info", {}).get("Deadline to Apply")
            
            # Skip if no deadline is set
            if not deadline_str:
                logger.warning(f"Skipping {uni_name} (ID: {uni_id}) - No deadline found")
                skipped_count += 1
                continue
            
            # Try to parse deadline in various formats
            deadline_date = None
            try:
                # Try YYYY-MM-DD format
                deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d")
            except ValueError:
                try:
                    # Try DD-MM-YYYY format
                    parts = deadline_str.split("-")
                    if len(parts) == 3 and len(parts[0]) == 2 and len(parts[1]) == 2 and len(parts[2]) == 4:
                        iso_deadline = f"{parts[2]}-{parts[1]}-{parts[0]}"
                        deadline_date = datetime.strptime(iso_deadline, "%Y-%m-%d")
                except ValueError:
                    logger.warning(f"Skipping {uni_name} (ID: {uni_id}) - Could not parse deadline: {deadline_str}")
                    skipped_count += 1
                    continue
            
            # If we successfully parsed the deadline, check if it's in the future
            if deadline_date:
                admission_open = deadline_date > current_date
                current_status = uni_data.get("admissionOpen", None)
                
                # Only update if the status has changed
                if current_status != admission_open:
                    logger.info(f"Updating {uni_name} (ID: {uni_id}) - Deadline: {deadline_str}, Setting admission status to: {admission_open}")
                    universities_ref.document(uni_id).update({"admissionOpen": admission_open})
                    updated_count += 1
                else:
                    logger.debug(f"No change needed for {uni_name} (ID: {uni_id}) - Status already {admission_open}")
                    skipped_count += 1
            
        except Exception as e:
            logger.error(f"Error updating {uni_name} (ID: {uni_id}): {str(e)}")
            error_count += 1
    
    logger.info(f"Admission status update completed: {updated_count} updated, {skipped_count} skipped, {error_count} errors")
    return 0

if __name__ == "__main__":
    try:
        exit_code = update_admission_status()
        sys.exit(exit_code)
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        sys.exit(1) 