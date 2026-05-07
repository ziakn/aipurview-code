import pytest
from pathlib import Path
from fastapi.testclient import TestClient


@pytest.fixture
def grs_root(tmp_path: Path) -> Path:
    """Minimal GRS_ROOT with required directory structure."""
    (tmp_path / "configs").mkdir()
    (tmp_path / "datasets").mkdir()
    for name in ["obligations.yaml", "mutations.yaml", "judge_rubric.yaml",
                 "models.yaml", "run_config.yaml"]:
        (tmp_path / "configs" / name).write_text(f"# {name}\n")
    (tmp_path / "configs" / "templates").mkdir()
    (tmp_path / "configs" / "templates" / "base_scenarios.yaml").write_text("# templates\n")
    (tmp_path / "configs" / "catalogs").mkdir()
    return tmp_path


@pytest.fixture
def client(grs_root: Path):
    # Set GRS_ROOT BEFORE importing app
    from ui.backend import routers as routers_module
    routers_module.set_grs_root(grs_root)

    # Now import app (which won't override GRS_ROOT)
    from ui.backend.app import app
    return TestClient(app)
