"""GRS Validation Playground — interactive semantic validator.

Launch (from GRSModule/):
    uv run streamlit run viewer.py
Then navigate to "Validation Playground" in the sidebar.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "src"))

from validate.semantic import (  # noqa: E402
    SYSTEM_PROMPT,
    SemanticParseError,
    SemanticResult,
    _parse_llm_response,
    _GOVERNANCE_TRIGGER_KEYS,
    _TENSION_SIGNAL_KEYS,
)
from llm.openrouter import OpenRouterChatClient  # noqa: E402
from llm.retry import retry_with_backoff, RetryConfig  # noqa: E402


# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------

def _init_session_state() -> None:
    if "playground_system_prompt" not in st.session_state:
        st.session_state["playground_system_prompt"] = SYSTEM_PROMPT
    if "playground_result" not in st.session_state:
        st.session_state["playground_result"] = None


# ---------------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------------

def _render_sidebar() -> tuple[str, float, bool]:
    """Render sidebar config. Returns (model_id, temperature, api_key_ok)."""
    with st.sidebar:
        st.header("Model Config")
        model_id = st.text_input("Model ID", value="openai/gpt-4o-mini")
        temperature = st.slider(
            "Temperature",
            min_value=0.0,
            max_value=1.0,
            value=0.0,
            step=0.05,
        )
        st.divider()
        api_key = os.environ.get("OPENROUTER_API_KEY", "")
        if api_key:
            st.markdown(
                '<span style="color:#2d7a2d">✓ API key set</span>',
                unsafe_allow_html=True,
            )
            api_key_ok = True
        else:
            st.error("✗ OPENROUTER_API_KEY not set")
            api_key_ok = False
    return model_id, temperature, api_key_ok


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    st.title("Validation Playground")
    st.caption("Send any scenario to the semantic validator and inspect the model's reasoning.")

    _init_session_state()
    model_id, temperature, api_key_ok = _render_sidebar()


main()
