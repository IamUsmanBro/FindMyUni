#!/usr/bin/env python3
import sys
import os

# Add the backend_project directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend_project'))

# Import the FastAPI app
from backend_project.app.main import app

# Vercel expects the app to be available as 'app'
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
