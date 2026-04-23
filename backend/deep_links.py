"""
Deep link mapping for popular apps.

Strategy per context:
- Desktop: 302 redirect direct (no deep link needed)
- Android regular browser: intent:// URI with scheme=https (most reliable)
- Android in-app browser (Telegram, IG, etc.): same intent:// but via <a> tag click
- iOS regular browser: URI scheme attempt with JS fallback
- iOS in-app browser: URI scheme via user-tap button (WebViews block auto-redirect)
"""

from urllib.parse import urlparse, parse_qs, quote


# ─── App configurations ─────────────────────────────────────

APP_CONFIGS = {
    "youtube": {
        "domains": ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"],
        "ios_scheme": "vnd.youtube",
        "android_package": "com.google.android.youtube",
        "display_name": "YouTube",
        "icon": "📺",
    },
    "instagram": {
        "domains": ["instagram.com", "www.instagram.com"],
        "ios_scheme": "instagram",
        "android_package": "com.instagram.android",
        "display_name": "Instagram",
        "icon": "📸",
    },
    "tiktok": {
        "domains": ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
        "ios_scheme": "snssdk1233",
        "android_package": "com.zhiliaoapp.musically",
        "display_name": "TikTok",
        "icon": "🎵",
    },
    "twitter": {
        "domains": ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
        "ios_scheme": "twitter",
        "android_package": "com.twitter.android",
        "display_name": "X (Twitter)",
        "icon": "🐦",
    },
    "spotify": {
        "domains": ["open.spotify.com", "spotify.com"],
        "ios_scheme": "spotify",
        "android_package": "com.spotify.music",
        "display_name": "Spotify",
        "icon": "🎧",
    },
    "linkedin": {
        "domains": ["linkedin.com", "www.linkedin.com"],
        "ios_scheme": "linkedin",
        "android_package": "com.linkedin.android",
        "display_name": "LinkedIn",
        "icon": "💼",
    },
    "facebook": {
        "domains": ["facebook.com", "www.facebook.com", "fb.com", "m.facebook.com"],
        "ios_scheme": "fb",
        "android_package": "com.facebook.katana",
        "display_name": "Facebook",
        "icon": "👤",
    },
    "snapchat": {
        "domains": ["snapchat.com", "www.snapchat.com"],
        "ios_scheme": "snapchat",
        "android_package": "com.snapchat.android",
        "display_name": "Snapchat",
        "icon": "👻",
    },
    "pinterest": {
        "domains": ["pinterest.com", "www.pinterest.com", "pin.it"],
        "ios_scheme": "pinterest",
        "android_package": "com.pinterest",
        "display_name": "Pinterest",
        "icon": "📌",
    },
    "reddit": {
        "domains": ["reddit.com", "www.reddit.com", "old.reddit.com"],
        "ios_scheme": "reddit",
        "android_package": "com.reddit.frontpage",
        "display_name": "Reddit",
        "icon": "🔴",
    },
    "twitch": {
        "domains": ["twitch.tv", "www.twitch.tv", "m.twitch.tv"],
        "ios_scheme": "twitch",
        "android_package": "tv.twitch.android.app",
        "display_name": "Twitch",
        "icon": "🎮",
    },
    "amazon": {
        "domains": ["amazon.com", "www.amazon.com", "amazon.fr", "www.amazon.fr", "amazon.de", "amazon.co.uk", "amzn.to"],
        "ios_scheme": "com.amazon.mobile.shopping",
        "android_package": "com.amazon.mShop.android.shopping",
        "display_name": "Amazon",
        "icon": "🛒",
    },
}


# ─── In-app browser detection ───────────────────────────────

IN_APP_BROWSER_SIGNATURES = [
    "telegram",      # Telegram
    "fban", "fbav",  # Facebook
    "instagram",     # Instagram
    "twitter",       # Twitter/X
    "linkedin",      # LinkedIn
    "snapchat",      # Snapchat
    "bytedance",     # TikTok
    "musical_ly",    # TikTok (old)
    "line/",         # LINE
    "weibo",         # Weibo
    "micromessenger", # WeChat
    "kakaotalk",     # KakaoTalk
]


def is_in_app_browser(user_agent: str) -> bool:
    """Detect if request comes from an in-app browser (WebView)."""
    ua = user_agent.lower()
    return any(sig in ua for sig in IN_APP_BROWSER_SIGNATURES)


def detect_in_app_source(user_agent: str) -> str | None:
    """Identify which app's in-app browser we're in."""
    ua = user_agent.lower()
    if "telegram" in ua:
        return "Telegram"
    elif "instagram" in ua:
        return "Instagram"
    elif "fban" in ua or "fbav" in ua:
        return "Facebook"
    elif "twitter" in ua:
        return "Twitter"
    elif "linkedin" in ua:
        return "LinkedIn"
    elif "bytedance" in ua or "musical_ly" in ua:
        return "TikTok"
    elif "snapchat" in ua:
        return "Snapchat"
    return None


# ─── App identification ─────────────────────────────────────

def identify_app(url: str) -> str | None:
    """Identify which app a URL belongs to."""
    try:
        parsed = urlparse(url)
        domain = (parsed.hostname or "").lower()
        for app_name, config in APP_CONFIGS.items():
            if domain in config["domains"]:
                return app_name
    except Exception:
        pass
    return None


# ─── Deep link builders ─────────────────────────────────────

def _build_android_intent(host: str, path: str, package: str, fallback_url: str) -> str:
    """
    Build an Android Intent URI.
    Uses scheme=https with full host — this is the format that works
    in WebViews and in-app browsers (not just Chrome).
    """
    encoded_fallback = quote(fallback_url, safe="")
    return (
        f"intent://{host}{path}"
        f"#Intent;scheme=https;package={package};"
        f"S.browser_fallback_url={encoded_fallback};end"
    )


def build_youtube_deep_link(url: str, platform: str) -> dict:
    """Build YouTube-specific deep links (both iOS and Android)."""
    parsed = urlparse(url)
    path = parsed.path
    query = parse_qs(parsed.query)
    query_string = f"?{parsed.query}" if parsed.query else ""

    video_id = None
    if "v" in query:
        video_id = query["v"][0]
    elif parsed.hostname == "youtu.be" and path:
        video_id = path.lstrip("/")
    elif "/shorts/" in path:
        video_id = path.split("/shorts/")[1].split("/")[0].split("?")[0]

    if video_id:
        ios_scheme = f"vnd.youtube://watch?v={video_id}"
        android_intent = _build_android_intent(
            "www.youtube.com", f"/watch?v={video_id}",
            "com.google.android.youtube", url
        )
    else:
        ios_scheme = f"vnd.youtube://{path.lstrip('/')}"
        host = parsed.hostname or "www.youtube.com"
        android_intent = _build_android_intent(
            host, f"{path}{query_string}",
            "com.google.android.youtube", url
        )

    return {"ios_scheme": ios_scheme, "android_intent": android_intent}


def build_instagram_deep_link(url: str, platform: str) -> dict:
    """Build Instagram-specific deep links."""
    parsed = urlparse(url)
    path = parsed.path.strip("/")

    if not path:
        ios_scheme = "instagram://app"
    else:
        parts = path.split("/")
        if len(parts) == 1:
            ios_scheme = f"instagram://user?username={parts[0]}"
        elif parts[0] == "p" and len(parts) >= 2:
            ios_scheme = f"instagram://media?id={parts[1]}"
        elif parts[0] in ("reel", "reels") and len(parts) >= 2:
            ios_scheme = f"instagram://reels?id={parts[1]}"
        else:
            ios_scheme = "instagram://app"

    android_intent = _build_android_intent(
        "www.instagram.com", f"/{path}" if path else "/",
        "com.instagram.android", url
    )

    return {"ios_scheme": ios_scheme, "android_intent": android_intent}


def build_tiktok_deep_link(url: str, platform: str) -> dict:
    """Build TikTok-specific deep links."""
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    host = parsed.hostname or "www.tiktok.com"

    ios_scheme = f"snssdk1233://open?url={quote(url, safe='')}"
    android_intent = _build_android_intent(
        host, f"/{path}" if path else "/",
        "com.zhiliaoapp.musically", url
    )

    return {"ios_scheme": ios_scheme, "android_intent": android_intent}


def build_generic_deep_link(url: str, app_name: str) -> dict:
    """Build deep links for any supported app."""
    config = APP_CONFIGS.get(app_name)
    if not config:
        return {"ios_scheme": None, "android_intent": None}

    parsed = urlparse(url)
    path = parsed.path or "/"
    query_string = f"?{parsed.query}" if parsed.query else ""
    host = parsed.hostname or ""

    ios_scheme = f"{config['ios_scheme']}://{path.lstrip('/')}{query_string}"
    android_intent = _build_android_intent(
        host, f"{path}{query_string}",
        config["android_package"], url
    )

    return {"ios_scheme": ios_scheme, "android_intent": android_intent}


# ─── Main entry point ───────────────────────────────────────

def get_deep_link(url: str, user_agent: str) -> dict:
    """
    Get complete deep link info for a URL + device context.

    Returns everything the template needs to make the right redirect decision.
    """
    platform = detect_platform(user_agent)
    app = identify_app(url)
    in_app = is_in_app_browser(user_agent)
    in_app_source = detect_in_app_source(user_agent) if in_app else None

    ios_scheme = None
    android_intent = None

    if app and platform in ("ios", "android"):
        builders = {
            "youtube": build_youtube_deep_link,
            "instagram": build_instagram_deep_link,
            "tiktok": build_tiktok_deep_link,
        }

        builder = builders.get(app)
        if builder:
            links = builder(url, platform)
        else:
            links = build_generic_deep_link(url, app)

        ios_scheme = links.get("ios_scheme")
        android_intent = links.get("android_intent")

    app_config = APP_CONFIGS.get(app, {})

    return {
        "app": app,
        "app_name": app_config.get("display_name", app),
        "app_icon": app_config.get("icon", "🔗"),
        "platform": platform,
        "is_in_app_browser": in_app,
        "in_app_source": in_app_source,
        "ios_scheme": ios_scheme,
        "android_intent": android_intent,
        "fallback_url": url,
        "has_deep_link": (ios_scheme is not None or android_intent is not None),
    }


# ─── Device detection helpers (unchanged) ───────────────────

def detect_platform(user_agent: str) -> str:
    ua = user_agent.lower()
    if "iphone" in ua or "ipad" in ua or "ipod" in ua:
        return "ios"
    elif "android" in ua:
        return "android"
    return "desktop"


def detect_device_type(user_agent: str) -> str:
    ua = user_agent.lower()
    if "ipad" in ua or "tablet" in ua:
        return "tablet"
    elif "iphone" in ua or "ipod" in ua or ("android" in ua and "mobile" in ua):
        return "mobile"
    elif "android" in ua:
        return "tablet"
    return "desktop"


def detect_os(user_agent: str) -> str:
    ua = user_agent.lower()
    if "iphone" in ua or "ipad" in ua or "ipod" in ua:
        return "iOS"
    elif "android" in ua:
        return "Android"
    elif "windows" in ua:
        return "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        return "macOS"
    elif "linux" in ua:
        return "Linux"
    return "Unknown"


def detect_browser(user_agent: str) -> str:
    ua = user_agent.lower()
    if "telegram" in ua:
        return "Telegram"
    elif "instagram" in ua:
        return "Instagram"
    elif "fban" in ua or "fbav" in ua:
        return "Facebook"
    elif "twitter" in ua:
        return "Twitter"
    elif "tiktok" in ua or "bytedance" in ua:
        return "TikTok"
    elif "linkedin" in ua:
        return "LinkedIn"
    elif "snapchat" in ua:
        return "Snapchat"
    elif "edg/" in ua:
        return "Edge"
    elif "opr/" in ua or "opera" in ua:
        return "Opera"
    elif "chrome" in ua and "safari" in ua:
        return "Chrome"
    elif "firefox" in ua:
        return "Firefox"
    elif "safari" in ua:
        return "Safari"
    return "Other"
