"""
Authentication and authorization module.
"""

import os
import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext

from models import User, UserCreate, UserRole
from database import DatabaseManager


class AuthManager:
    """Handles authentication and user management."""
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.algorithm = "HS256"
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.security = HTTPBearer()
    
    def hash_password(self, password: str) -> str:
        """Hash a password."""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=30)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> dict:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    async def create_user(self, email: str, password: str, role: UserRole = UserRole.USER) -> User:
        """Create a new user."""
        # Simple in-memory user storage for MVP
        # In production, this should use the database
        user_id = secrets.token_urlsafe(16)
        hashed_password = self.hash_password(password)
        
        user = User(
            id=user_id,
            email=email,
            role=role,
            created_at=datetime.utcnow()
        )
        
        # Store user (simplified for MVP)
        # In production: await db_manager.create_user(user, hashed_password)
        _users_store[email] = {
            "user": user,
            "password_hash": hashed_password
        }
        
        return user
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        # Simple in-memory authentication for MVP
        # In production: user = await db_manager.get_user_by_email(email)
        user_data = _users_store.get(email)
        
        if not user_data:
            return None
        
        if not self.verify_password(password, user_data["password_hash"]):
            return None
        
        return user_data["user"]
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        user_data = _users_store.get(email)
        return user_data["user"] if user_data else None


# Global auth manager instance
auth_manager = None

# Simple in-memory user storage for MVP
_users_store = {}

def get_auth_manager() -> AuthManager:
    """Get global auth manager instance."""
    global auth_manager
    if auth_manager is None:
        secret_key = os.getenv("SECRET_KEY", "your_super_secret_jwt_key_here_minimum_32_characters")
        auth_manager = AuthManager(secret_key)
    return auth_manager


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> User:
    """Get current authenticated user from JWT token."""
    try:
        auth_mgr = get_auth_manager()
        
        # Extract token from credentials
        token = credentials.credentials
        
        # Verify token
        payload = auth_mgr.verify_token(token)
        
        # Get user email from token
        email = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
        # Get user
        user = await auth_mgr.get_user_by_email(email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and verify admin role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def create_default_admin():
    """Create default admin user for development."""
    try:
        auth_mgr = get_auth_manager()
        
        # Create default admin if not exists
        admin_email = "admin@example.com"
        admin_password = "admin123"
        
        if admin_email not in _users_store:
            user_id = secrets.token_urlsafe(16)
            hashed_password = auth_mgr.hash_password(admin_password)
            
            admin_user = User(
                id=user_id,
                email=admin_email,
                role=UserRole.ADMIN,
                created_at=datetime.utcnow()
            )
            
            _users_store[admin_email] = {
                "user": admin_user,
                "password_hash": hashed_password
            }
            
            print(f"Created default admin user: {admin_email} / {admin_password}")
    
    except Exception as e:
        print(f"Error creating default admin: {e}")


# Create default admin on module import
create_default_admin()
