"""add business_assumptions table

Revision ID: 5e8a9b1c2d3f
Revises: 4d49a00ea721
Create Date: 2026-07-22 05:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '5e8a9b1c2d3f'
down_revision = '4d49a00ea721'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'business_assumptions',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('cogs_percent', sa.Float(), nullable=False, server_default='60.0'),
        sa.Column('platform_fee_percent', sa.Float(), nullable=False, server_default='10.0'),
        sa.Column('gst_low_rate', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('gst_low_threshold', sa.Float(), nullable=False, server_default='2500.0'),
        sa.Column('gst_high_rate', sa.Float(), nullable=False, server_default='18.0'),
        sa.Column('shipping_tiers', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[{"maxAmount": 500, "fee": 40}, {"maxAmount": 1000, "fee": 70}, {"fee": 100}]'),
        sa.Column('return_loss_amount', sa.Float(), nullable=False, server_default='140.0'),
        sa.Column('risk_tier_high', sa.Float(), nullable=False, server_default='0.5'),
        sa.Column('risk_tier_medium', sa.Float(), nullable=False, server_default='0.2'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )


def downgrade():
    op.drop_table('business_assumptions')
