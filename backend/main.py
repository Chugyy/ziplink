"""
Ziplink - Smart Link Tracker with Deep Linking

A link shortener that tracks clicks and redirects to native apps
via deep links on mobile devices.
"""

import os
import string
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv

from fastapi.middleware.cors import CORSMiddleware

from database import get_pool, close_pool, init_db
from auth import (
    AuthRequest,
    UpdateUsernameRequest,
    signup,
    login,
    get_current_user,
    update_username,
)
from deep_links import (
    get_deep_link,
    detect_platform,
    detect_device_type,
    detect_os,
    detect_browser,
    identify_app,
    is_in_app_browser,
)
from models import (
    CreateLinkRequest,
    UpdateLinkRequest,
    LinkResponse,
    LinkStatsResponse,
    LinkListResponse,
    ClickResponse,
    OverviewStatsResponse,
)

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8900")
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    try:
        await init_db()
    except Exception as e:
        print(f"WARNING: Database init failed: {e}")
    yield
    await close_pool()


app = FastAPI(
    title="Ziplink",
    description="Smart Link Tracker with Deep Linking",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_short_url(username: str, slug: str) -> str:
    return f"{BASE_URL}/{username}/{slug}"


# ─── Auth Routes ─────────────────────────────────────────────


@app.post("/api/auth/signup")
async def auth_signup(req: AuthRequest):
    return await signup(req)


@app.post("/api/auth/login")
async def auth_login(req: AuthRequest):
    return await login(req)


@app.get("/api/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return user


@app.patch("/api/auth/username")
async def auth_update_username(request: Request, req: UpdateUsernameRequest):
    return await update_username(request, req)


def generate_slug(length: int = 7) -> str:
    """Generate a random URL-safe slug."""
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


# ─── API Routes ──────────────────────────────────────────────


@app.post("/api/links", response_model=LinkResponse)
async def create_link(req: CreateLinkRequest, request: Request):
    """Create a new tracked short link."""
    user = await get_current_user(request)
    pool = await get_pool()

    import uuid
    user_id = uuid.UUID(user["id"])
    username = user["username"]

    slug = req.custom_slug or generate_slug()

    # Check slug uniqueness within user's links
    existing = await pool.fetchrow(
        "SELECT id FROM links WHERE user_id = $1 AND slug = $2", user_id, slug
    )
    if existing:
        if req.custom_slug:
            raise HTTPException(status_code=409, detail=f"Slug '{slug}' already taken")
        for _ in range(5):
            slug = generate_slug()
            existing = await pool.fetchrow(
                "SELECT id FROM links WHERE user_id = $1 AND slug = $2", user_id, slug
            )
            if not existing:
                break
        else:
            raise HTTPException(status_code=500, detail="Could not generate unique slug")

    row = await pool.fetchrow(
        """
        INSERT INTO links (user_id, slug, destination_url, title)
        VALUES ($1, $2, $3, $4)
        RETURNING id, slug, destination_url, title, created_at, is_active
        """,
        user_id,
        slug,
        req.destination_url,
        req.title,
    )

    return LinkResponse(
        id=row["id"],
        slug=row["slug"],
        destination_url=row["destination_url"],
        title=row["title"],
        short_url=_build_short_url(username, row["slug"]),
        created_at=row["created_at"],
        is_active=row["is_active"],
        total_clicks=0,
    )


@app.get("/api/links", response_model=LinkListResponse)
async def list_links(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List all links for the current user."""
    user = await get_current_user(request)
    pool = await get_pool()

    import uuid
    user_id = uuid.UUID(user["id"])
    username = user["username"]

    rows = await pool.fetch(
        """
        SELECT l.*, COALESCE(c.click_count, 0) as total_clicks
        FROM links l
        LEFT JOIN (
            SELECT link_id, COUNT(*) as click_count
            FROM clicks
            GROUP BY link_id
        ) c ON c.link_id = l.id
        WHERE l.user_id = $1
        ORDER BY l.created_at DESC
        LIMIT $2 OFFSET $3
        """,
        user_id,
        limit,
        offset,
    )

    total = await pool.fetchval("SELECT COUNT(*) FROM links WHERE user_id = $1", user_id)

    links = [
        LinkResponse(
            id=r["id"],
            slug=r["slug"],
            destination_url=r["destination_url"],
            title=r["title"],
            short_url=_build_short_url(username, r["slug"]),
            created_at=r["created_at"],
            is_active=r["is_active"],
            total_clicks=r["total_clicks"],
        )
        for r in rows
    ]

    return LinkListResponse(links=links, total=total)


@app.get("/api/links/{link_id}/stats", response_model=LinkStatsResponse)
async def get_link_stats(link_id: str, request: Request):
    """Get detailed stats for a link."""
    user = await get_current_user(request)
    pool = await get_pool()

    import uuid
    user_id = uuid.UUID(user["id"])
    username = user["username"]

    # Try by slug first, then by UUID
    link = await pool.fetchrow(
        """
        SELECT l.*, COALESCE(c.click_count, 0) as total_clicks
        FROM links l
        LEFT JOIN (SELECT link_id, COUNT(*) as click_count FROM clicks GROUP BY link_id) c ON c.link_id = l.id
        WHERE l.slug = $1 AND l.user_id = $2
        """,
        link_id,
        user_id,
    )

    if not link:
        try:
            link_uuid = uuid.UUID(link_id)
            link = await pool.fetchrow(
                """
                SELECT l.*, COALESCE(c.click_count, 0) as total_clicks
                FROM links l
                LEFT JOIN (SELECT link_id, COUNT(*) as click_count FROM clicks GROUP BY link_id) c ON c.link_id = l.id
                WHERE l.id = $1 AND l.user_id = $2
                """,
                link_uuid,
                user_id,
            )
        except (ValueError, Exception):
            pass

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    clicks_rows = await pool.fetch(
        "SELECT * FROM clicks WHERE link_id = $1 ORDER BY clicked_at DESC LIMIT 100",
        link["id"],
    )

    clicks = [
        ClickResponse(
            id=r["id"],
            clicked_at=r["clicked_at"],
            ip_address=str(r["ip_address"]) if r["ip_address"] else None,
            device_type=r["device_type"],
            os=r["os"],
            browser=r["browser"],
            country=r["country"],
            city=r["city"],
            is_deep_link=r["is_deep_link"],
            app_target=r["app_target"],
            referer=r["referer"],
        )
        for r in clicks_rows
    ]

    stats_data = await pool.fetchrow(
        """
        SELECT
            COUNT(*) as total,
            COUNT(DISTINCT ip_address) as unique_ips,
            COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile,
            COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop,
            COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet,
            COUNT(*) FILTER (WHERE is_deep_link = true) as deep_links,
            COUNT(*) FILTER (WHERE os = 'iOS') as ios,
            COUNT(*) FILTER (WHERE os = 'Android') as android
        FROM clicks WHERE link_id = $1
        """,
        link["id"],
    )

    top_browsers = await pool.fetch(
        "SELECT browser, COUNT(*) as count FROM clicks WHERE link_id = $1 AND browser IS NOT NULL GROUP BY browser ORDER BY count DESC LIMIT 5",
        link["id"],
    )

    top_referers = await pool.fetch(
        "SELECT referer, COUNT(*) as count FROM clicks WHERE link_id = $1 AND referer IS NOT NULL AND referer != '' GROUP BY referer ORDER BY count DESC LIMIT 5",
        link["id"],
    )

    stats = {
        "total_clicks": stats_data["total"],
        "unique_visitors": stats_data["unique_ips"],
        "devices": {"mobile": stats_data["mobile"], "desktop": stats_data["desktop"], "tablet": stats_data["tablet"]},
        "platforms": {"ios": stats_data["ios"], "android": stats_data["android"]},
        "deep_link_opens": stats_data["deep_links"],
        "top_browsers": {r["browser"]: r["count"] for r in top_browsers},
        "top_referers": {r["referer"]: r["count"] for r in top_referers},
    }

    return LinkStatsResponse(
        link=LinkResponse(
            id=link["id"],
            slug=link["slug"],
            destination_url=link["destination_url"],
            title=link["title"],
            short_url=_build_short_url(username, link["slug"]),
            created_at=link["created_at"],
            is_active=link["is_active"],
            total_clicks=link["total_clicks"],
        ),
        clicks=clicks,
        stats=stats,
    )


@app.patch("/api/links/{link_id}", response_model=LinkResponse)
async def update_link(link_id: str, req: UpdateLinkRequest, request: Request):
    """Update a link's title, destination, or active status."""
    user = await get_current_user(request)
    pool = await get_pool()

    import uuid
    user_id = uuid.UUID(user["id"])
    username = user["username"]

    link = await pool.fetchrow(
        "SELECT * FROM links WHERE (id::text = $1 OR slug = $1) AND user_id = $2",
        link_id,
        user_id,
    )
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    updates = {}
    if req.title is not None:
        updates["title"] = req.title
    if req.destination_url is not None:
        updates["destination_url"] = req.destination_url
    if req.is_active is not None:
        updates["is_active"] = req.is_active

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = list(updates.values())

    row = await pool.fetchrow(
        f"""
        UPDATE links SET {set_clauses}
        WHERE id = $1
        RETURNING id, slug, destination_url, title, created_at, is_active
        """,
        link["id"],
        *values,
    )

    click_count = await pool.fetchval("SELECT COUNT(*) FROM clicks WHERE link_id = $1", link["id"])

    return LinkResponse(
        id=row["id"],
        slug=row["slug"],
        destination_url=row["destination_url"],
        title=row["title"],
        short_url=_build_short_url(username, row["slug"]),
        created_at=row["created_at"],
        is_active=row["is_active"],
        total_clicks=click_count,
    )


@app.get("/api/stats/overview", response_model=OverviewStatsResponse)
async def get_overview_stats(request: Request):
    """Aggregate stats for the dashboard header."""
    user = await get_current_user(request)
    pool = await get_pool()

    import uuid
    user_id = uuid.UUID(user["id"])

    row = await pool.fetchrow(
        """
        SELECT
            (SELECT COUNT(*) FROM links WHERE user_id = $1) as total_links,
            (SELECT COUNT(*) FROM clicks c JOIN links l ON c.link_id = l.id WHERE l.user_id = $1) as total_clicks,
            (SELECT COUNT(*) FROM clicks c JOIN links l ON c.link_id = l.id WHERE l.user_id = $1 AND c.is_deep_link = true) as deep_link_opens
        """,
        user_id,
    )

    return OverviewStatsResponse(
        total_links=row["total_links"],
        total_clicks=row["total_clicks"],
        deep_link_opens=row["deep_link_opens"],
    )


@app.delete("/api/links/{link_id}")
async def delete_link(link_id: str, request: Request):
    """Delete a link and all its clicks."""
    user = await get_current_user(request)
    pool = await get_pool()

    import uuid
    user_id = uuid.UUID(user["id"])

    result = await pool.execute(
        "DELETE FROM links WHERE (id::text = $1 OR slug = $1) AND user_id = $2",
        link_id,
        user_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Link not found")
    return {"status": "deleted"}


# ─── Redirect Route (THE CORE) ──────────────────────────────


@app.get("/{username}/{slug}")
async def redirect_link(username: str, slug: str, request: Request):
    """
    The main redirect endpoint: /{username}/{slug}

    1. Look up the user by username
    2. Look up the link by slug within that user
    3. Log the click with device info
    4. On mobile: serve a smart redirect page that tries deep link first
    5. On desktop: direct 302 redirect
    """
    # Skip API and docs paths
    if username in ("api", "docs", "openapi.json", "redoc", "favicon.ico"):
        raise HTTPException(status_code=404)

    pool = await get_pool()

    # Find user by username
    user = await pool.fetchrow("SELECT id FROM users WHERE username = $1", username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find link by slug within user
    link = await pool.fetchrow(
        "SELECT id, destination_url, is_active FROM links WHERE slug = $1 AND user_id = $2",
        slug,
        user["id"],
    )

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    if not link["is_active"]:
        raise HTTPException(status_code=410, detail="Link is no longer active")

    destination = link["destination_url"]
    user_agent = request.headers.get("user-agent", "")
    referer = request.headers.get("referer", "")
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or request.client.host

    # Detect device info
    platform = detect_platform(user_agent)
    device_type = detect_device_type(user_agent)
    os_name = detect_os(user_agent)
    browser = detect_browser(user_agent)
    app_target = identify_app(destination)

    # Get deep link
    dl_info = get_deep_link(destination, user_agent)
    has_deep_link = dl_info["has_deep_link"]

    # Log the click
    try:
        await pool.execute(
            """
            INSERT INTO clicks (link_id, ip_address, user_agent, referer, device_type, os, browser, is_deep_link, app_target)
            VALUES ($1, $2::inet, $3, $4, $5, $6, $7, $8, $9)
            """,
            link["id"],
            ip if ip and ip != "testclient" else None,
            user_agent,
            referer,
            device_type,
            os_name,
            browser,
            has_deep_link,
            app_target,
        )
    except Exception as e:
        print(f"Error logging click: {e}")

    # Desktop → direct redirect
    if platform == "desktop":
        return RedirectResponse(url=destination, status_code=302)

    # Mobile → smart redirect page with deep link attempt
    if has_deep_link:
        return templates.TemplateResponse(
            "redirect.html",
            {
                "request": request,
                "app_name": dl_info["app_name"],
                "app_icon": dl_info["app_icon"],
                "platform": platform,
                "is_in_app_browser": dl_info["is_in_app_browser"],
                "in_app_source": dl_info["in_app_source"],
                "ios_scheme": dl_info["ios_scheme"] or "",
                "android_intent": dl_info["android_intent"] or "",
                "fallback_url": destination,
            },
        )

    # Mobile but no deep link mapping → direct redirect
    return RedirectResponse(url=destination, status_code=302)


# ─── Health check ────────────────────────────────────────────


@app.get("/api/health")
async def health():
    pool = await get_pool()
    result = await pool.fetchval("SELECT 1")
    return {"status": "ok", "db": result == 1}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8900")),
        reload=True,
    )
