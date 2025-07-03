"""
Script to clean university names in the database by removing "Admissions Open" text.
"""
import firebase_admin
from firebase_admin import credentials, firestore
import os
import sys
import logging
from app.utils.text_processing import clean_university_name

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("clean_uni_names")

# Initialize Firebase
def initialize_firebase():
    try:
        # Search in multiple locations for the credentials file
        possible_paths = [
            # Current directory
            "firebase_key.json",
            "firebase-service-account.json",
            # Parent directory
            os.path.join("..", "firebase-service-account.json"),
            # Absolute paths
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
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
            firebase_app = firebase_admin.initialize_app(cred)
            db = firestore.client()
            logger.info(f"Firebase initialized successfully")
            return db
        else:
            logger.error("Could not find Firebase credentials file in any of the expected locations")
            return None
            
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        return None

def clean_university_names():
    """
    Clean all university names in the database by removing "Admissions Open" text
    """
    db = initialize_firebase()
    if not db:
        logger.error("Failed to initialize Firebase. Exiting.")
        sys.exit(1)
        
    try:
        # Get all universities
        universities_ref = db.collection("universities")
        universities = universities_ref.get()
        
        # Count for reporting
        total_count = 0
        updated_count = 0
        
        for uni in universities:
            total_count += 1
            uni_data = uni.to_dict()
            original_name = uni_data.get("name", "")
            
            if not original_name:
                logger.warning(f"University with ID {uni.id} has no name. Skipping.")
                continue
                
            # Clean the name
            cleaned_name = clean_university_name(original_name)
            
            # Only update if the name has changed
            if cleaned_name != original_name:
                logger.info(f"Cleaning name: '{original_name}' -> '{cleaned_name}'")
                universities_ref.document(uni.id).update({"name": cleaned_name})
                updated_count += 1
            
        logger.info(f"Processing complete. Checked {total_count} universities, updated {updated_count} names.")
        
    except Exception as e:
        logger.error(f"Error cleaning university names: {e}")
        sys.exit(1)

if __name__ == "__main__":
    logger.info("Starting university name cleanup script...")
    clean_university_names()
    logger.info("Script completed.") 