"""
Async PostgreSQL connection pool for the AI Gateway.
Uses the verifywise schema via search_path.
"""

import logging
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from src.config import settings

logger = logging.getLogger("uvicorn")

_engine = None
_session_factory = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url,
            pool_size=10,
            max_overflow=5,
            pool_pre_ping=True,
            echo=False,
        )
    return _engine


def get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            _get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


@asynccontextmanager
async def get_db():
    """Async context manager: yields a DB session with verifywise search_path set."""
    factory = get_session_factory()
    session = factory()
    try:
        await session.execute(text("SET search_path TO verifywise, public"))
        yield session
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
