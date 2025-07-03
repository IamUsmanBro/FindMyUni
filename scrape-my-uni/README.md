# Scrape My Uni

A university search and comparison application for Pakistani students.

## Overview

Scrape My Uni helps students find and compare universities in Pakistan. It provides information about programs, admissions, scholarships, and more.


## Features

- Search for universities by name, location, or program
- Compare multiple universities side by side
- View university details including programs, admissions, and scholarships
- Save favorite universities
- Get notifications about upcoming deadlines
- **University Scraping**: Automatically scrapes university websites for the latest admission information
- **Application Tracking**: Track your university applications in one place
- **Profile Management**: Comprehensive user profile system with educational background and preferences
- **Admin Dashboard**: Manage universities, users, and applications
- **Real-time Updates**: Get notified about new admissions and deadlines

## New Features

- **Enhanced Profile Management**: Complete user profile system with personal details, educational background, preferences, and security settings
- **Database Optimization**: Streamlined database structure with improved data organization
- **Improved UI**: Better visual feedback and consistent styling across the application

## Setup

### Prerequisites

- Node.js (v16+) for frontend
- Python 3.9+ for backend
- npm or yarn
- Firebase account
- Python 3.8+ (for web scraping backend)
- FastAPI (for API server)

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```
   cd NE/scrape-my-uni
   npm install
   ```
3. Install backend dependencies:
   ```
   cd NE/backend_project
   pip install -r requirements.txt
   ```

4. Set up Firebase:
   - Make sure the `firebase-service-account.json` file is present in the `NE/backend_project` directory
   - Create a `.env` file in the `NE/backend_project` directory with the following content:
   ```
   GOOGLE_APPLICATION_CREDENTIALS="./firebase-service-account.json"
   PORT=8000
   ENV=development
   ```
   
   - Create a `.env` file in the `NE/scrape-my-uni` frontend directory with:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

### Running the Application

To run the complete application, you need to start both the backend and frontend servers:

1. Start the Python backend:
   ```
   cd NE/backend_project
   python server.py
   ```
   The backend will run on http://localhost:8000

2. In a separate terminal, start the frontend:
   ```
   cd NE/scrape-my-uni
   npm run dev
   ```
   The frontend will run on http://localhost:5173

### API Documentation

The Python backend provides a Swagger UI for API documentation at:
http://localhost:8000/docs

## Development

### Folder Structure

```
project/
├── NE/
│   ├── scrape-my-uni/       # Frontend React application
│   │   ├── public/          # Static assets
│   │   ├── src/             # React source code
│   │   │   ├── assets/      # Images, fonts, etc.
│   │   │   ├── components/  # Reusable components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── pages/       # Page components
│   │   │   ├── services/    # API services
│   │   │   └── utils/       # Utility functions
│   │   ├── package.json     # Frontend dependencies
│   │   └── vite.config.js   # Vite configuration
│   │
│   └── backend_project/     # Python FastAPI backend
│       ├── app/             # Main application code
│       │   ├── config/      # Configuration files
│       │   ├── models/      # Data models
│       │   ├── routers/     # API route handlers
│       │   ├── services/    # Business logic
│       │   └── utils/       # Utility functions
│       ├── server.py        # Server entry point
│       └── requirements.txt # Backend dependencies
```

## API Endpoints

The backend provides the following endpoints:

### Universities
- `GET /api/universities` - List all universities
- `GET /api/universities/{university_id}` - Get university details
- `GET /api/universities/programs` - Get all available programs
- `GET /api/universities/locations` - Get all available locations
- `POST /api/universities/search` - Search universities
- `GET /api/universities/{university_id}/programs` - Get programs for a specific university
- `GET /api/universities/{university_id}/admissions` - Get admissions details for a university
- `GET /api/universities/{university_id}/scholarships` - Get scholarships for a university
- `GET /api/universities/{university_id}/facilities` - Get facilities for a university

### Authentication
- `POST /api/auth/register` - Register a new user
- `GET /api/auth/me` - Get current user info

### Scraper
- `POST /api/scrape` - Trigger a new scraping task

## Database Maintenance

### Optimizing the Firestore Database

The project includes a database cleanup utility that helps maintain an optimized Firestore structure:

1. Run the cleanup script to remove unused collections and standardize data
```
node scripts/cleanup-firebase.js
```

This script:
- Removes unnecessary collections
- Migrates data from redundant collections to core collections
- Standardizes data formats for consistency

### Core Database Structure

The application uses the following core Firestore collections:

- **users**: User accounts and profile data
- **universities**: University information
- **applications**: User applications to universities
- **admins**: Admin user information
- **scrape_jobs**: Web scraping job tracking
- **scrape_requests**: User-initiated scrape requests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
