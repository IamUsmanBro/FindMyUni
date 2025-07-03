"""
Authentication utilities for API endpoints
"""
import logging
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from firebase_admin import auth, firestore
from pydantic import BaseModel
import time

logger = logging.getLogger(__name__)

class User(BaseModel):
    """Model for authenticated user"""
    uid: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    is_admin: bool = False

async def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[User]:
    """
    Validate Firebase token and return user information.
    For chatbot, authentication is optional - returns None for unauthenticated users.
    
    Args:
        authorization: Bearer token from authorization header
    
    Returns:
        User object if authenticated, None otherwise
    """
    if not authorization:
        return None
        
    try:
        # Extract token
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            return None
            
        # Verify token
        decoded_token = auth.verify_id_token(token)
        
        # Check if token is expired
        if time.time() > decoded_token.get('exp', 0):
            return None
            
        # Get user details
        uid = decoded_token.get('uid')
        if not uid:
            return None
            
        # Get additional user information
        try:
            user_record = auth.get_user(uid)
            
            # Multiple ways to check for admin status for reliability
            is_admin = False
            
            # 1. Check custom claims in the token
            if decoded_token.get('admin') is True:
                is_admin = True
                
            # 2. Check custom claims in user record
            if not is_admin and user_record.custom_claims and user_record.custom_claims.get('admin') is True:
                is_admin = True
            
            # 3. Check Firestore records as a backup
            if not is_admin:
                try:
                    db = firestore.client()
                    
                    # Check users collection
                    user_doc = db.collection('users').document(uid).get()
                    if user_doc.exists and (user_doc.get('role') == 'admin' or user_doc.get('isAdmin') is True):
                        is_admin = True
                        
                    # If still not admin, check admins collection
                    if not is_admin and user_record.email:
                        admin_query = db.collection('admins').where('email', '==', user_record.email.lower()).limit(1).get()
                        if len(admin_query) > 0:
                            is_admin = True
                            
                            # If found in admins collection but not in custom claims, update the custom claims
                            if not user_record.custom_claims or not user_record.custom_claims.get('admin'):
                                logger.info(f"Updating custom claims for user {uid} ({user_record.email}) to set admin=true")
                                auth.set_custom_user_claims(uid, {'admin': True})
                except Exception as db_error:
                    logger.warning(f"Error checking admin status in Firestore: {db_error}")
                
            logger.info(f"User authenticated: {user_record.email}, Admin: {is_admin}")
                
            return User(
                uid=uid,
                email=user_record.email,
                display_name=user_record.display_name,
                is_admin=is_admin
            )
        except Exception as user_error:
            logger.warning(f"Error getting user record: {user_error}")
            # Basic user with just the UID if record can't be fetched
            return User(uid=uid)
            
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        return None

async def get_required_user(authorization: Optional[str] = Header(None)) -> User:
    """
    Validate Firebase token and return user information.
    Raises HTTPException for unauthenticated users.
    
    Args:
        authorization: Bearer token from authorization header
    
    Returns:
        User object if authenticated
        
    Raises:
        HTTPException: If authentication fails
    """
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user

async def get_admin_user(authorization: Optional[str] = Header(None)) -> User:
    """
    Validate Firebase token and check admin status.
    Raises HTTPException for non-admin users.
    
    Args:
        authorization: Bearer token from authorization header
    
    Returns:
        User object if authenticated and is admin
        
    Raises:
        HTTPException: If authentication fails or user is not admin
    """
    user = await get_required_user(authorization)
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user 