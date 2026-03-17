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

# Only allow requests from Express backend (localhost)
origins = [os.environ.get("BACKEND_URL", "http://localhost:3000")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(completions_router)
app.include_router(models_router)
app.include_router(guardrails_router)


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
