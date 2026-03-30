from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

EXEMPT_PATHS = frozenset({"/health", "/ready", "/api/v1/telegram/webhook"})
SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})


class CSRFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, allowed_origins: list[str]):
        super().__init__(app)
        self.allowed_origins = {o.rstrip("/") for o in allowed_origins}

    async def dispatch(self, request: Request, call_next):
        if request.method in SAFE_METHODS:
            return await call_next(request)

        if request.url.path in EXEMPT_PATHS:
            return await call_next(request)

        # Require custom header -- browsers cannot send this cross-origin without preflight
        if request.headers.get("x-requested-with") != "XMLHttpRequest":
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF validation failed"},
            )

        # Validate Origin/Referer as defense-in-depth
        origin = request.headers.get("origin")
        if not origin:
            referer = request.headers.get("referer")
            if referer:
                parsed = urlparse(referer)
                origin = f"{parsed.scheme}://{parsed.netloc}"

        if origin and origin.rstrip("/") not in self.allowed_origins:
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF validation failed"},
            )

        return await call_next(request)
