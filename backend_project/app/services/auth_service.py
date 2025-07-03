# app/services/auth_service.py
from passlib.hash import bcrypt
from app.services.firebase_service import FirebaseService

class AuthService:
    def __init__(self, firebase_service: FirebaseService):
        self.firebase = firebase_service

    def register_user(self, email: str, password: str) -> str:
        """Register a new user (email/password). Returns the new user ID."""
        # Hash the password
        hashed_password = bcrypt.hash(password)
        user_data = {"email": email, "password": hashed_password}
        # Create document in 'users' collection
        user_id = self.firebase.create_document("users", user_data)
        return user_id

    def authenticate_user(self, email: str, password: str) -> dict:
        """Check user credentials. Returns user dict if valid, else None."""
        users = self.firebase.find_document("users", "email", "==", email)
        if not users:
            return None
        user = users[0]
        if bcrypt.verify(password, user["password"]):
            return user
        return None
