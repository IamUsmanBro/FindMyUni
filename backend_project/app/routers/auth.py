# app/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from firebase_admin import auth as firebase_auth
from app.services.firebase_service import FirebaseService
from app.utils.auth_middleware import get_current_user, FirebaseAuthMiddleware

router = APIRouter()
firebase_service = FirebaseService()
firebase_auth_middleware = FirebaseAuthMiddleware()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class LoginResponse(BaseModel):
    uid: str
    email: str
    display_name: Optional[str] = None
    role: str
    token: str

@router.post("/register", response_model=LoginResponse)
async def register(req: RegisterRequest):
    """Register a new user in Firebase Auth."""
    try:
        # Create user in Firebase Auth
        user = firebase_auth.create_user(
            email=req.email,
            password=req.password,
            display_name=req.display_name
        )
        
        # Store additional user data in Firestore
        user_data = {
            "email": req.email,
            "display_name": req.display_name,
            "role": "user",  # Default role
            "created_at": firebase_service.get_server_timestamp()
        }
        firebase_service.create_document("users", user_data, user.uid)
        
        # Create custom token for initial login
        token = firebase_auth.create_custom_token(user.uid)
        
        # Return user info and token
        return {
            "uid": user.uid,
            "email": user.email,
            "display_name": user.display_name,
            "role": "user",
            "token": token.decode('utf-8')
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login(req: LoginRequest):
    """
    This endpoint is for documentation purposes only. 
    
    Login should be handled by Firebase Auth directly from the frontend.
    The frontend should:
    1. Use Firebase Auth SDK to authenticate the user
    2. Get the ID token from Firebase Auth
    3. Send the ID token in the Authorization header for subsequent requests
    """
    raise HTTPException(
        status_code=501, 
        detail="Login should be handled by Firebase Auth directly from the frontend"
    )

@router.get("/me")
async def get_current_user_info(user = Depends(get_current_user)):
    """Get information about the currently authenticated user."""
    uid = user.get("uid")
    # Get user data from Firestore
    user_data = firebase_service.get_document("users", uid)
    if not user_data:
        # If user data doesn't exist in Firestore, get it from Auth
        try:
            auth_user = firebase_auth.get_user(uid)
            # Create user record in Firestore
            user_data = {
                "email": auth_user.email,
                "display_name": auth_user.display_name,
                "role": "user",  # Default role
                "created_at": firebase_service.get_server_timestamp()
            }
            firebase_service.create_document("users", user_data, uid)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"User not found: {str(e)}")
    
    # Return user info
    return {
        "uid": uid,
        "email": user_data.get("email"),
        "display_name": user_data.get("display_name"),
        "role": user_data.get("role", "user")
    }
