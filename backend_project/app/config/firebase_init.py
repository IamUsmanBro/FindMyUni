import os
import json
from firebase_admin import credentials, initialize_app, firestore
import logging

logger = logging.getLogger(__name__)

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if Firebase is already initialized
        from firebase_admin import get_app
        try:
            get_app()
            logger.info("Firebase already initialized")
            return firestore.client()
        except ValueError:
            pass
        
        # For production (Render), use environment variable
        firebase_creds = os.getenv('FIREBASE_CREDENTIALS_JSON')
        if firebase_creds:
            # Parse JSON credentials from environment variable
            cred_dict = json.loads(firebase_creds)
            cred = credentials.Certificate(cred_dict)
            logger.info("Using Firebase credentials from environment variable")
        else:
            # For local development, use file
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', './firebase-service-account.json')
            if os.path.exists(credentials_path):
                cred = credentials.Certificate(credentials_path)
                logger.info(f"Using Firebase credentials from file: {credentials_path}")
            else:
                logger.error("No Firebase credentials found")
                raise Exception("Firebase credentials not configured")
        
        # Initialize the app
        initialize_app(cred)
        logger.info("Firebase initialized successfully")
        
        return firestore.client()
        
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {str(e)}")
        raise

# Initialize Firebase when module is imported
db = initialize_firebase()
