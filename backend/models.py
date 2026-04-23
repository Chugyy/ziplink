from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
from uuid import UUID


class CreateLinkRequest(BaseModel):
    destination_url: str = Field(..., description="The URL to redirect to")
    title: str | None = Field(None, description="Optional title for the link")
    custom_slug: str | None = Field(None, description="Custom slug (auto-generated if not provided)")


class LinkResponse(BaseModel):
    id: UUID
    slug: str
    destination_url: str
    title: str | None
    short_url: str
    created_at: datetime
    is_active: bool
    total_clicks: int = 0


class ClickResponse(BaseModel):
    id: UUID
    clicked_at: datetime
    ip_address: str | None
    device_type: str | None
    os: str | None
    browser: str | None
    country: str | None
    city: str | None
    is_deep_link: bool
    app_target: str | None
    referer: str | None


class LinkStatsResponse(BaseModel):
    link: LinkResponse
    clicks: list[ClickResponse]
    stats: dict


class UpdateLinkRequest(BaseModel):
    title: str | None = None
    destination_url: str | None = None
    is_active: bool | None = None


class OverviewStatsResponse(BaseModel):
    total_links: int
    total_clicks: int
    deep_link_opens: int


class LinkListResponse(BaseModel):
    links: list[LinkResponse]
    total: int
