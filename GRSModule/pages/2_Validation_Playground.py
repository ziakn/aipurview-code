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
# Style helpers
# ---------------------------------------------------------------------------

def pill(text: str, color: str) -> str:
    return (
        f'<span style="background:{color};color:#fff;padding:2px 10px;'
        f'border-radius:12px;font-size:0.8em;margin:2px;display:inline-block">{text}</span>'
    )


# ---------------------------------------------------------------------------
# Column renderers
# ---------------------------------------------------------------------------

def _render_left_column() -> str:
    """Render system prompt editor. Returns current system prompt text."""
    st.subheader("System Prompt")
    if st.button("Reset to default"):
        st.session_state["playground_system_prompt"] = SYSTEM_PROMPT
        if "playground_system_prompt_area" in st.session_state:
            del st.session_state["playground_system_prompt_area"]

    system_prompt = st.text_area(
        label="system_prompt",
        value=st.session_state["playground_system_prompt"],
        height=420,
        label_visibility="collapsed",
        key="playground_system_prompt_area",
    )
    # Keep session state in sync with the text area value
    st.session_state["playground_system_prompt"] = system_prompt
    return system_prompt


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    st.title("Validation Playground")
    st.caption("Send any scenario to the semantic validator and inspect the model's reasoning.")

    _init_session_state()
    model_id, temperature, api_key_ok = _render_sidebar()

    left_col, right_col = st.columns([1, 1.2])

    with left_col:
        system_prompt = _render_left_column()

    with right_col:
        st.subheader("Scenario")


main()
