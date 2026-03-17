"""
Async PostgreSQL connection pool for the AI Gateway.
Uses the verifywise schema via search_path (set once per connection, not per session).
"""

import logging
from contextlib import asynccontextmanager

from sqlalchemy import event, text, URL
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from src.config import settings

logger = logging.getLogger("uvicorn")

_engine = None
_session_factory = None


def _get_engine():
    global _engine
    if _engine is None:
        # Use URL.create to keep password out of string representation (prevents log leaks)
        url = URL.create(
            drivername="postgresql+asyncpg",
            username=settings.db_user,
            password=settings.db_password,
            host=settings.db_host,
            port=settings.db_port,
            database=settings.db_name,
        )
        _engine = create_async_engine(
            url,
            pool_size=10,
            max_overflow=5,
            pool_recycle=1800,
            echo=False,
            hide_parameters=True,
        )
        # Set search_path once per connection (not per session)
        @event.listens_for(_engine.sync_engine, "connect")
        def _set_search_path(dbapi_conn, _connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("SET search_path TO verifywise, public")
            cursor.close()

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
    """Async context manager: yields a DB session. search_path is set at connection level."""
    factory = get_session_factory()
    session = factory()
    try:
        yield session
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
