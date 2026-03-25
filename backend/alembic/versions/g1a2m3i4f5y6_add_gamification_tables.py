"""add gamification tables

Revision ID: g1a2m3i4f5y6
Revises: e8f3a1b72c56, c7d8e9f01a23
Create Date: 2026-03-25 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g1a2m3i4f5y6'
down_revision: Union[str, None] = ('e8f3a1b72c56', 'c7d8e9f01a23')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- user_points ---
    op.create_table('user_points',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('total_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('current_streak_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_active_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index(op.f('ix_user_points_user_id'), 'user_points', ['user_id'], unique=True)

    # --- badges ---
    op.create_table('badges',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('name_es', sa.String(length=100), nullable=False),
        sa.Column('name_en', sa.String(length=100), nullable=False),
        sa.Column('description_es', sa.String(length=300), nullable=False),
        sa.Column('description_en', sa.String(length=300), nullable=False),
        sa.Column('icon', sa.String(length=50), nullable=False),
        sa.Column('condition', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key'),
    )

    # --- user_badges ---
    op.create_table('user_badges',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('badge_id', sa.Integer(), nullable=False),
        sa.Column('earned_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['badge_id'], ['badges.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'badge_id', name='uq_user_badge'),
    )
    op.create_index(op.f('ix_user_badges_user_id'), 'user_badges', ['user_id'], unique=False)

    # --- seed badges ---
    badges_table = sa.table(
        'badges',
        sa.column('key', sa.String),
        sa.column('name_es', sa.String),
        sa.column('name_en', sa.String),
        sa.column('description_es', sa.String),
        sa.column('description_en', sa.String),
        sa.column('icon', sa.String),
        sa.column('condition', sa.String),
    )
    op.bulk_insert(badges_table, [
        {
            'key': 'first_report',
            'name_es': 'Primer Informe',
            'name_en': 'First Report',
            'description_es': 'Envia tu primer informe comunitario',
            'description_en': 'Submit your first community report',
            'icon': 'file-text',
            'condition': 'community_reports>=1',
        },
        {
            'key': 'prepared_citizen',
            'name_es': 'Ciudadano Preparado',
            'name_en': 'Prepared Citizen',
            'description_es': 'Alcanza 80% en preparacion',
            'description_en': 'Reach 80% preparedness score',
            'icon': 'shield-check',
            'condition': 'preparedness_score>=80',
        },
        {
            'key': 'safety_champion',
            'name_es': 'Campeon de Seguridad',
            'name_en': 'Safety Champion',
            'description_es': 'Completa todos los items de preparacion',
            'description_en': 'Complete all preparedness items',
            'icon': 'trophy',
            'condition': 'all_items_complete',
        },
        {
            'key': 'week_warrior',
            'name_es': 'Guerrero Semanal',
            'name_en': 'Week Warrior',
            'description_es': '7 dias consecutivos de actividad',
            'description_en': '7-day engagement streak',
            'icon': 'flame',
            'condition': 'streak>=7',
        },
        {
            'key': 'month_master',
            'name_es': 'Maestro del Mes',
            'name_en': 'Month Master',
            'description_es': '30 dias consecutivos de actividad',
            'description_en': '30-day engagement streak',
            'icon': 'crown',
            'condition': 'streak>=30',
        },
        {
            'key': 'community_guardian',
            'name_es': 'Guardian Comunitario',
            'name_en': 'Community Guardian',
            'description_es': 'Verifica 10 informes comunitarios',
            'description_en': 'Verify 10 community reports',
            'icon': 'users',
            'condition': 'verifications>=10',
        },
        {
            'key': 'early_adopter',
            'name_es': 'Pionero',
            'name_en': 'Early Adopter',
            'description_es': 'Completa el proceso de incorporacion',
            'description_en': 'Complete the onboarding process',
            'icon': 'rocket',
            'condition': 'onboarding_complete',
        },
    ])


def downgrade() -> None:
    op.drop_index(op.f('ix_user_badges_user_id'), table_name='user_badges')
    op.drop_table('user_badges')
    op.drop_table('badges')
    op.drop_index(op.f('ix_user_points_user_id'), table_name='user_points')
    op.drop_table('user_points')
