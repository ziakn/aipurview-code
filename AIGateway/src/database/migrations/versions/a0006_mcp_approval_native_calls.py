"""Make approval tool_id nullable for native (non-MCP) tool-call approvals.

Native tool calls (e.g. a coding agent's built-in Bash) have no row in
ai_gateway_mcp_tools, so their approval requests carry a NULL tool_id and rely
on tool_name instead.

Revision ID: a0006
Revises: a0005
Create Date: 2026-06-15
"""

from typing import Sequence, Union

from alembic import op

revision: str = "a0006"
down_revision: Union[str, None] = "a0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("SET search_path TO verifywise")
    op.execute("""
        ALTER TABLE ai_gateway_mcp_approval_requests
        ALTER COLUMN tool_id DROP NOT NULL
    """)


def downgrade() -> None:
    op.execute("SET search_path TO verifywise")
    # Re-applying NOT NULL fails if NULL rows exist; clear native-call rows first.
    op.execute("""
        DELETE FROM ai_gateway_mcp_approval_requests WHERE tool_id IS NULL
    """)
    op.execute("""
        ALTER TABLE ai_gateway_mcp_approval_requests
        ALTER COLUMN tool_id SET NOT NULL
    """)
