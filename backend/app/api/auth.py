from fastapi import APIRouter, HTTPException, status

from app.core.jwt import create_access_token
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

auth_service = AuthService()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(user: RegisterRequest):
    result = auth_service.register_user(
        username=user.username,
        email=user.email,
        password=user.password,
    )

    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists",
        )

    return result


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(user: LoginRequest):
    authenticated_user = auth_service.authenticate_user(
        email=user.email,
        password=user.password,
    )

    if authenticated_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        authenticated_user["id"]
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }