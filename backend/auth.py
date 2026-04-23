"""
Simple JWT auth for Ziplink.
"""

import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException
from pydantic import BaseModel, EmailStr

from database import get_pool

JWT_SECRET = os.getenv("JWT_SECRET", "ziplink-secret-change-in-prod-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72


class AuthRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = auth_header[7:]
    payload = decode_token(token)
    return {"id": payload["sub"], "email": payload["email"]}


async def signup(req: AuthRequest) -> AuthResponse:
    pool = await get_pool()

    existing = await pool.fetchrow("SELECT id FROM users WHERE email = $1", req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = hash_password(req.password)
    row = await pool.fetchrow(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
        req.email,
        hashed,
    )

    token = create_token(str(row["id"]), row["email"])
    return AuthResponse(
        token=token,
        user={"id": str(row["id"]), "email": row["email"]},
    )


async def login(req: AuthRequest) -> AuthResponse:
    pool = await get_pool()

    row = await pool.fetchrow("SELECT id, email, password_hash FROM users WHERE email = $1", req.email)
    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(str(row["id"]), row["email"])
    return AuthResponse(
        token=token,
        user={"id": str(row["id"]), "email": row["email"]},
    )
