from __future__ import annotations
import os
import subprocess
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

import yaml

from ..models import RunRequest, RunStatus
from ..state import run_state
from .snapshot import write_snapshot, write_result

# Path to the grs-scenarios entry point inside the project venv
_GRS_BIN = Path(__file__).parent.parent.parent.parent / ".venv" / "bin" / "grs-scenarios"


def build_command(stage: str, dataset_version: str, params: dict) -> List[str]:
    """Build a grs-scenarios CLI command for the given stage and parameters."""
    base = [str(_GRS_BIN), "generate", "--stage", stage,
            "--dataset-version", dataset_version, "--out-dir", "datasets"]

    def _add(flag: str, value):
        """Add a flag and value if value is not None."""
        if value is None:
            return
        base.extend([flag, str(value)])

    def _flag(flag: str, condition: bool):
        """Add a flag if condition is True."""
        if condition:
            base.append(flag)

    if stage == "render":
        _add("--seed", params.get("seed", 42))
        _add("--per-obligation", params.get("per_obligation", 2))

    elif stage == "perturb":
        _add("--k-per-base", params.get("k_per_base", 3))
        _add("--coverage", params.get("coverage", "per_family"))

    elif stage == "validate":
        _add("--provider", params.get("provider", "openrouter"))
        _add("--validator-model-id", params.get("validator_model_id", "openai/gpt-4o-mini"))

    elif stage == "infer":
        _add("--provider", params.get("infer_provider", "openrouter"))
        _add("--temperature", params.get("temperature", 0.2))
        _add("--max-tokens", params.get("max_tokens", 500))
        _add("--limit", params.get("limit"))
        _flag("--resume", params.get("resume", False))

    elif stage == "judge":
        _add("--judge-temperature", params.get("judge_temperature", 0.0))
        _add("--judge-limit", params.get("limit"))
        _flag("--judge-resume", params.get("resume", False))

    return base


def write_run_config(grs_root: Path, request: RunRequest):
    """Write run_config.yaml with all stage parameters from the RunRequest."""
    p = request.params
    config = {
        "version": request.dataset_version,
        "stages": {
            "render": {
                "seed": p.get("seed", 42),
                "per_obligation": p.get("per_obligation", 2),
            },
            "perturb": {
                "k_per_base": p.get("k_per_base", 3),
                "coverage": p.get("coverage", "per_family"),
            },
            "validate": {
                "provider": p.get("provider", "openrouter"),
                "validator_model_id": p.get("validator_model_id", "openai/gpt-4o-mini"),
            },
            "infer": {
                "provider": p.get("infer_provider", "openrouter"),
                "temperature": p.get("temperature", 0.2),
                "max_tokens": p.get("max_tokens", 500),
                "limit": p.get("limit"),
                "resume": p.get("resume", False),
            },
            "judge": {
                "judge_temperature": p.get("judge_temperature", 0.0),
                "limit": p.get("limit"),
                "resume": p.get("resume", False),
            },
        },
    }
    path = grs_root / "configs" / "run_config.yaml"
    path.write_text(yaml.dump(config, default_flow_style=False, allow_unicode=True))
