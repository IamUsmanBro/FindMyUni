# app/utils/auth_middleware.py
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import time

security = HTTPBearer()

class FirebaseAuthMiddleware:
    async def __call__(self, request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
        if credentials is None:
            raise HTTPException(status_code=401, detail="Bearer authentication required")
        
        token = credentials.credentials
        try:
            # Verify Firebase token
            decoded_token = auth.verify_id_token(token)
            
            # Check if token is expired
            exp = decoded_token.get('exp')
            if exp and int(time.time()) > exp:
                raise HTTPException(status_code=401, detail="Token has expired")
            
            # Add user info to request state
            request.state.user = {
                "uid": decoded_token.get("uid"),
                "email": decoded_token.get("email"),
                "role": decoded_token.get("role", "user")
            }
            
            return request.state.user
            
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(e)}")

# Dependency to get current user
async def get_current_user(request: Request):
    if not hasattr(request.state, "user"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return request.state.user

# Dependency to check for admin role
async def get_admin_user(user = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user 