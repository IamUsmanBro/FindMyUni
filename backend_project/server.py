import os
import sys
import uvicorn
import logging
from dotenv import load_dotenv

# Add app directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("server")

def start_server():
    """Start the FastAPI server with uvicorn."""
    
    PORT = int(os.getenv("PORT", "8000"))  # Use port 8000 to match frontend config
    
    logger.info(f"Starting server on port {PORT}")
    
    # We need to import app after environment variables are loaded
    from app.main import app
    
    # Start the server with CORS enabled
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        log_level="info"
    )

if __name__ == "__main__":
    start_server()
