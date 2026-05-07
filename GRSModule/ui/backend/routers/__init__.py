from pathlib import Path
from typing import Optional

# Global GRS_ROOT that can be overridden by tests or runtime
_GRS_ROOT: Optional[Path] = None


def get_grs_root() -> Path:
    """Get the current GRS_ROOT. Returns default if not explicitly set."""
    global _GRS_ROOT
    if _GRS_ROOT is None:
        _GRS_ROOT = Path(__file__).parent.parent.parent
    return _GRS_ROOT


def set_grs_root(root: Path) -> None:
    """Set the GRS_ROOT. Used primarily by tests."""
    global _GRS_ROOT
    _GRS_ROOT = root
