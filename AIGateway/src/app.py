import os
import sys
from importlib.metadata import version

import litellm
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routers.completions import router as completions_router
from src.routers.models import router as models_router
from src.routers.guardrails import router as guardrails_router
from src.routers.proxy import router as proxy_router

# Disable LiteLLM verbose logging to prevent key leakage
litellm.suppress_debug_info = True

# Fail fast if the internal API key is missing or is a placeholder value
_PLACEHOLDER_VALUES = {"", "changeme", "change-me", "your-secret-key", "secret"}
if settings.internal_api_key.lower() in _PLACEHOLDER_VALUES:
    print(
        "FATAL: AI_GATEWAY_INTERNAL_KEY is not set or is a placeholder. "
        "Set a strong random value before starting the gateway.",
        file=sys.stderr,
    )
    sys.exit(1)

app = FastAPI(title="VerifyWise AI Gateway", version="1.0.0")

# CORS: allow Express backend + any employee SDK origin
origins = [
    os.environ.get("BACKEND_URL", "http://localhost:3000"),
    "*",  # Virtual key endpoints are auth-gated, CORS is safe
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Internal routes (Express backend → Gateway, authenticated via x-internal-key)
# Mounted under /internal prefix to avoid conflict with public /v1 routes
app.include_router(completions_router, prefix="/internal", tags=["Internal"])
app.include_router(models_router, prefix="/internal", tags=["Internal"])
app.include_router(guardrails_router, prefix="/internal", tags=["Internal"])

# Public routes (Employee SDK → Gateway, authenticated via virtual key)
# OpenAI-compatible: /v1/chat/completions, /v1/embeddings, /v1/models
app.include_router(proxy_router, tags=["Proxy"])


@app.get("/health")
async def health():
    litellm_version = "unknown"
    try:
        litellm_version = version("litellm")
    except Exception:
        pass
    return {
        "status": "ok",
        "litellm_version": litellm_version,
        "models_in_cost_db": len(litellm.model_cost),
    }
