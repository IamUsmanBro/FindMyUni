# app/main.py
import os
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
import sys
import datetime
from fastapi.staticfiles import StaticFiles

# Configure root logger first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="ScrapeMyUni Backend",
    description="API for ScrapeMyUni application providing university data and scraping functionalities",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",  # React dev server
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*"  # Allow all origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Initialize Firebase
try:
    from app.config.firebase import init_firebase
    init_firebase()
    logger.info("Firebase initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {str(e)}")
    print(f"Error initializing Firebase: {str(e)}")

# Start background scheduler
try:
    from app.services.scheduler_service import start_scheduler
    start_scheduler()
    logger.info("Background scheduler started")
except Exception as e:
    logger.error(f"Failed to start scheduler: {str(e)}")
    print(f"Error starting scheduler: {str(e)}")

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors and return a clean response."""
    logger.warning(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions and prevent stack traces from leaking to clients."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

# Import routers (moved after Firebase initialization)
try:
    from app.routers import auth, university, application, scraper, admin
    
    # Include routers with /api prefix
    app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
    app.include_router(university.router, prefix="/api/universities", tags=["Universities"])
    app.include_router(application.router, prefix="/api/application", tags=["Application"])
    app.include_router(scraper.router, prefix="/api/scrape", tags=["Scraper"])
    app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
except Exception as e:
    logger.error(f"Error loading routers: {str(e)}")
    print(f"Error loading routers: {str(e)}")

# Optional root endpoint
@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {"message": "ScrapeMyUni API is running."}

@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "ok",
        "version": app.version,
        "environment": os.getenv("ENV", "development")
    }

# Add a duplicate endpoint for /api/health for consistency
@app.get("/api/health", tags=["Health"])
async def api_health_check():
    """Detailed health check endpoint with /api prefix."""
    # Set response headers directly for CORS
    return JSONResponse(
        content={
            "status": "ok",
            "version": app.version,
            "environment": os.getenv("ENV", "development"),
            "timestamp": str(datetime.datetime.now())
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cache-Control": "no-cache, no-store, must-revalidate"
        }
    )

# Add favicon handler to root level
@app.get('/favicon.ico', include_in_schema=False)
async def favicon():
    """Serve favicon.ico"""
    # Return a default icon or empty response
    # This prevents 404 errors for favicon requests
    return JSONResponse(content={'message': 'No favicon available'}, status_code=204)
