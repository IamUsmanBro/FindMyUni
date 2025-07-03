#!/usr/bin/env python
"""
Simple script to clear the Firebase cache.
Run this before the demo if you need to ensure fresh data.
"""
import os
import sys
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def main():
    """Clear the Firebase cache"""
    try:
        # Initialize Firebase
        from app.config.firebase import init_firebase
        init_firebase()
        
        # Import the Firebase service
        from app.services.firebase_service import FirebaseService
        
        # Create a new instance and clear the cache
        firebase_service = FirebaseService()
        firebase_service.clear_cache()
        
        logger.info("Firebase cache cleared successfully")
        return 0
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 