"""add_orders_sku_category_indexes

Revision ID: 4d49a00ea721
Revises: 2c339af14fba
Create Date: 2026-07-14 11:36:21.489334

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4d49a00ea721'
down_revision: Union[str, Sequence[str], None] = '2c339af14fba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add composite indexes on orders(user_id, sku) and orders(user_id, category)
    to support fast SQL-level pagination and aggregation in Module 6 analytics queries."""
    op.create_index(
        'ix_orders_user_id_sku',
        'orders',
        ['user_id', 'sku'],
    )
    op.create_index(
        'ix_orders_user_id_category',
        'orders',
        ['user_id', 'category'],
    )


def downgrade() -> None:
    op.drop_index('ix_orders_user_id_sku', table_name='orders')
    op.drop_index('ix_orders_user_id_category', table_name='orders')
