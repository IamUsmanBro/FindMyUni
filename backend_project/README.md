# ScrapeMyUni Backend

A Python backend using FastAPI for ScrapeMyUni application. This backend interacts with Firebase Firestore to store and retrieve university data and provides RESTful endpoints for the frontend.

## Features

- **Firebase Integration**: Full integration with Firebase Authentication and Firestore
- **RESTful API**: Complete API for university data management and scraping
- **Authentication**: Firebase Auth-based authentication with role-based access control
- **Pagination and Filtering**: Sophisticated filtering and pagination for university data
- **Background Scraping**: Asynchronous website scraping with task tracking
- **Logging**: Comprehensive logging system
- **Error Handling**: Robust error handling and validation

## Setup

### Prerequisites

- Python 3.9+
- Firebase project with Firestore database and Authentication enabled

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd backend_project
```

2. Install the required packages:
```bash
pip install -r requirements.txt
```

3. Set up Firebase credentials:
   - Go to your [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > Service accounts
   - Click "Generate new private key"
   - Save the file as `firebase-service-account.json` and place it in the root directory of the project

4. Create a `.env` file in the root directory with the following contents:
```
GOOGLE_APPLICATION_CREDENTIALS="./firebase-service-account.json"
PORT=8000
ENV=development
```

### Firebase Setup

1. Enable Firebase Authentication in your Firebase project
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication

2. Set up Firestore Database
   - Go to Firestore Database
   - Create a database if you haven't already
   - Start in test mode or set up security rules

## Running the Application

Start the server:
```bash
python server.py
```

The API will be available at `http://localhost:8000`.

The API documentation is available at `http://localhost:8000/docs`.

## Available Endpoints

### Universities

- `GET /universities` - Get all universities with pagination and filtering
- `GET /universities/{univ_id}` - Get a specific university by ID
- `POST /universities` - Create or update a university (admin only)
- `DELETE /universities/{univ_id}` - Delete a university (admin only)
- `POST /universities/search` - Advanced search with multiple filters

### Scraping

- `POST /scrape` - Trigger a new scraping task (admin only)
- `GET /scrape/{task_id}` - Check the status of a scraping task (admin only)
- `GET /scrape` - Get all scraping tasks (admin only)

### Auth

- `POST /auth/register` - Register a new user
- `GET /auth/me` - Get current user information

## Example Requests

### Filtering Universities

```bash
curl -X 'GET' \
  'http://localhost:8000/universities?page=1&limit=10&name=University&location=Lahore' \
  -H 'accept: application/json'
```

### Advanced Search

```bash
curl -X 'POST' \
  'http://localhost:8000/universities/search' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "University",
  "location": "Lahore",
  "program_categories": ["Bachelor", "Master"],
  "programs": ["Computer Science"],
  "page": 1,
  "limit": 10
}'
```

### Creating/Updating a University (requires admin authentication)

```bash
curl -X 'POST' \
  'http://localhost:8000/universities' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_FIREBASE_ID_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Example University",
  "basic_info": {
    "Location": "City, Country",
    "Founded": "1950"
  },
  "description": "This is a great university",
  "programs": {
    "Bachelor": ["Computer Science", "Mathematics"],
    "Master": ["Data Science"]
  },
  "apply_link": "https://example.com/apply",
  "url": "https://example.com"
}'
```

### Triggering Scraper (requires admin authentication)

```bash
curl -X 'POST' \
  'http://localhost:8000/scrape' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_FIREBASE_ID_TOKEN'
```

## Development

The backend code is organized in the following structure:

- `app/` - Main application package
  - `config/` - Configuration files
  - `models/` - Pydantic models
  - `routers/` - API endpoint definitions
  - `services/` - Business logic
  - `utils/` - Utility functions and middleware
  - `main.py` - FastAPI application entry point
- `logs/` - Log files directory
- `server.py` - Server startup script
- `requirements.txt` - Package dependencies

## Authentication

This backend uses Firebase Authentication. The frontend should:

1. Use Firebase Auth SDK to authenticate the user
2. Get the ID token from Firebase Auth
3. Send the ID token in the Authorization header for subsequent requests:
   ```
   Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
   ```

Protected routes will validate the token and check user roles before allowing access.

## Logging

Logs are stored in the `logs/` directory:
- `app.log` - General application logs
- `scraper.log` - Scraper-specific logs 