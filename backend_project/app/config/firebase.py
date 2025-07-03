# app/config/firebase.py
import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

def init_firebase():
    """Initialize Firebase Admin SDK."""
    # Check if Firebase is already initialized
    if firebase_admin._apps:
        logger.info("Firebase already initialized")
        return
    
    # Check if we should use the Firebase emulator/mock for testing
    use_emulator = os.getenv("FIREBASE_EMULATOR", "").lower() == "true"
    
    if use_emulator:
        try:
            # Import mock configuration for testing
            from app.config.test_config import mock_firebase_init
            mock_module = mock_firebase_init()
            
            # Monkey-patch the firebase_admin module for testing
            firebase_admin.auth = mock_module["auth"]
            firebase_admin.firestore = mock_module["firestore"]
            
            logger.info("Using Firebase emulator/mock for testing")
            return
        except Exception as e:
            logger.error(f"Failed to initialize Firebase mock: {str(e)}")
            raise
    
    # Normal Firebase initialization
    try:
        # Try to get credentials from environment variable (production)
        firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
        if firebase_creds_json:
            try:
                cred_dict = json.loads(firebase_creds_json)
                cred = credentials.Certificate(cred_dict)
                logger.info("Using Firebase credentials from environment variable")
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in FIREBASE_CREDENTIALS_JSON: {str(e)}")
                raise
        else:
            # Fallback to service account file (local development)
            cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./firebase-service-account.json")
            if not os.path.exists(cred_path):
                raise FileNotFoundError(f"Service account file not found at: {cred_path}")
            cred = credentials.Certificate(cred_path)
            logger.info(f"Using Firebase credentials from file: {cred_path}")
        
        # Initialize Firebase app
        firebase_admin.initialize_app(cred)
        
        # Initialize Firestore client
        db = firestore.client()
        logger.info("Firebase initialized successfully")
        return db
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {str(e)}")
        raise
