# FindMyUni - University Application Tracker

A comprehensive platform for tracking university applications in Pakistan with AI-powered assistance.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- Firebase account
- Gemini AI API key

### Frontend Setup

1. Clone the repository
```bash
git clone <repository-url>
cd ScrapeMyUni/scrape-my-uni
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your actual credentials:
# - Firebase configuration
# - Gemini API key
# - API URL
```

4. Start the development server
```bash
npm run dev
```

### Backend Setup

1. Navigate to backend directory
```bash
cd ../backend_project
```

2. Install Python dependencies
```bash
pip install -r requirements.txt
```

3. Set up Firebase service account
```bash
# Add your firebase-service-account.json file
# Configure environment variables
```

4. Start the backend server
```bash
python server.py
```

## 🔐 Security Setup

### Environment Variables
This project uses environment variables to keep sensitive information secure. **Never commit your `.env` file to version control.**

Required environment variables for frontend:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `GEMINI_API_KEY`

### Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore, and Storage
3. Get your configuration from Project Settings
4. Add the configuration to your `.env` file

## 📁 Project Structure

```
ScrapeMyUni/
├── scrape-my-uni/          # Frontend (React + Vite)
│   ├── src/
│   ├── public/
│   └── .env.example
├── backend_project/        # Backend (FastAPI + Python)
│   ├── app/
│   ├── scripts/
│   └── requirements.txt
└── README.md
```

## 🛠️ Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `python server.py` - Start API server
- `python run_scraper_script.py` - Run university data scraper

## 🚨 Important Security Notes

1. **Never commit sensitive files:**
   - `.env` files
   - `firebase-service-account.json`
   - Any file containing API keys or credentials

2. **Environment files are already ignored in `.gitignore`**

3. **Use `.env.example` as a template for setting up your local environment**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Ensure all sensitive data is properly secured
4. Commit your changes
5. Push to your branch
6. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.
