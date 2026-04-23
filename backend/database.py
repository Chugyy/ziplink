import asyncpg
import os

pool: asyncpg.Pool | None = None


INIT_SQL = """
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    username      varchar(50) UNIQUE,
    created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS links (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
    slug            varchar(50) NOT NULL,
    destination_url text NOT NULL,
    title           varchar(255),
    created_at      timestamptz DEFAULT now(),
    is_active       boolean DEFAULT true,
    UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);

CREATE TABLE IF NOT EXISTS clicks (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id      uuid REFERENCES links(id) ON DELETE CASCADE,
    clicked_at   timestamptz DEFAULT now(),
    ip_address   inet,
    user_agent   text,
    referer      text,
    device_type  varchar(20),
    os           varchar(50),
    browser      varchar(50),
    country      varchar(100),
    city         varchar(100),
    is_deep_link boolean DEFAULT false,
    app_target   varchar(50)
);

CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);

-- Migration: add columns if tables already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
        ALTER TABLE users ADD COLUMN username varchar(50) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='links' AND column_name='user_id') THEN
        ALTER TABLE links ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    -- Drop old unique constraint on slug alone if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='links_slug_key' AND table_name='links') THEN
        ALTER TABLE links DROP CONSTRAINT links_slug_key;
    END IF;
END $$;
"""


def _build_dsn() -> str:
    """Build the DSN from DATABASE_URL, or from DB_* parts."""
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "tapit-db")
    user = os.getenv("DB_USER", "hugo")
    pwd = os.getenv("DB_PASSWORD", "")

    auth = f"{user}:{pwd}" if pwd else user
    return f"postgresql://{auth}@{host}:{port}/{name}"


async def init_db():
    """Run schema bootstrap (idempotent)."""
    p = await get_pool()
    async with p.acquire() as conn:
        await conn.execute(INIT_SQL)


async def get_pool() -> asyncpg.Pool:
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(
            dsn=_build_dsn(),
            min_size=2,
            max_size=10,
        )
    return pool


async def close_pool():
    global pool
    if pool:
        await pool.close()
        pool = None
