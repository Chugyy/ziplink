"""
Simple JWT auth for Ziplink.
"""

import os
import re
import uuid as _uuid
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException
from pydantic import BaseModel

from database import get_pool

JWT_SECRET = os.getenv("JWT_SECRET", "ziplink-secret-change-in-prod-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72

# Whitelist: only these emails can sign up (comma-separated)
_raw = os.getenv("ALLOWED_EMAILS", "")
ALLOWED_EMAILS = [e.strip().lower() for e in _raw.split(",") if e.strip()]


class AuthRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UpdateUsernameRequest(BaseModel):
    username: str


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


def _validate_username(username: str) -> str:
    """Validate and normalize username."""
    username = username.strip().lower()
    if len(username) < 2 or len(username) > 30:
        raise HTTPException(status_code=400, detail="Username must be 2-30 characters")
    if not re.match(r'^[a-z0-9][a-z0-9._-]*$', username):
        raise HTTPException(status_code=400, detail="Username can only contain lowercase letters, numbers, dots, hyphens, underscores")
    reserved = {"api", "auth", "admin", "dashboard", "login", "signup", "settings", "docs", "health", "static", "public", "www"}
    if username in reserved:
        raise HTTPException(status_code=400, detail=f"'{username}' is reserved")
    return username


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = auth_header[7:]
    payload = decode_token(token)

    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT id, email, username FROM users WHERE id = $1",
        _uuid.UUID(payload["sub"]),
    )
    if not row:
        raise HTTPException(status_code=401, detail="User not found")

    return {"id": str(row["id"]), "email": row["email"], "username": row["username"]}


async def signup(req: AuthRequest) -> AuthResponse:
    pool = await get_pool()

    # Check whitelist
    if ALLOWED_EMAILS and req.email.strip().lower() not in ALLOWED_EMAILS:
        raise HTTPException(
            status_code=403,
            detail="signup_blocked",
        )

    existing = await pool.fetchrow("SELECT id FROM users WHERE email = $1", req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Generate default username from email
    default_username = req.email.split("@")[0].lower()
    default_username = re.sub(r'[^a-z0-9._-]', '', default_username)[:20] or "user"

    hashed = hash_password(req.password)
    row = await pool.fetchrow(
        "INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username",
        req.email,
        hashed,
        default_username,
    )

    token = create_token(str(row["id"]), row["email"])
    return AuthResponse(
        token=token,
        user={"id": str(row["id"]), "email": row["email"], "username": row["username"]},
    )


async def login(req: AuthRequest) -> AuthResponse:
    pool = await get_pool()

    row = await pool.fetchrow("SELECT id, email, password_hash, username FROM users WHERE email = $1", req.email)
    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(str(row["id"]), row["email"])
    return AuthResponse(
        token=token,
        user={"id": str(row["id"]), "email": row["email"], "username": row["username"]},
    )


async def update_username(request: Request, req: UpdateUsernameRequest):
    user = await get_current_user(request)
    username = _validate_username(req.username)

    pool = await get_pool()

    existing = await pool.fetchrow(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        username,
        _uuid.UUID(user["id"]),
    )
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    await pool.execute(
        "UPDATE users SET username = $1 WHERE id = $2",
        username,
        _uuid.UUID(user["id"]),
    )

    return {"username": username}
