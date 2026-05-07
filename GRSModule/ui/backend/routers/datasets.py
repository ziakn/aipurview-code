from fastapi import APIRouter
from ..models import DatasetList
from . import get_grs_root

router = APIRouter()


@router.get("/datasets", response_model=DatasetList)
def list_datasets():
    grs_root = get_grs_root()
    datasets_dir = grs_root / "datasets"
    if not datasets_dir.exists():
        return DatasetList(versions=[])
    dirs = [d for d in datasets_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]
    dirs.sort(key=lambda d: d.stat().st_mtime, reverse=True)
    return DatasetList(versions=[d.name for d in dirs])
