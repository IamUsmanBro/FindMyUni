# app/config/firebase.py
import os
import logging
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

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
    
    # Normal Firebase initialization with service account
    try:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if not cred_path:
            raise ValueError("GOOGLE_APPLICATION_CREDENTIALS env var is not set")
        
        # Check if file exists
        if not os.path.exists(cred_path):
            raise FileNotFoundError(f"Service account file not found at: {cred_path}")
        
        logger.info(f"Initializing Firebase with credentials from: {cred_path}")
        
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        
        # Initialize Firestore client
        db = firestore.client()
        logger.info("Firebase initialized successfully with real credentials")
        return db
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {str(e)}")
        raise
