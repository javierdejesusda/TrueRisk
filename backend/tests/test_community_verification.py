"""Tests for duplicate community report verification prevention."""

import pytest
from datetime import timedelta

from app.utils.time import utcnow

from sqlalchemy import select

from app.models.community_report import CommunityReport, ReportVerification
from app.models.user import User
from app.services.community_service import verify_report


class TestReportVerificationModel:
    """ReportVerification model and unique constraint."""

    @pytest.mark.asyncio
    async def test_report_verification_table_exists(self, client):
        """ReportVerification model should be importable and have the correct tablename."""
        assert ReportVerification.__tablename__ == "report_verifications"

    @pytest.mark.asyncio
    async def test_unique_constraint_prevents_duplicate(self, client):
        """Inserting two verifications with the same (report_id, user_id) should fail."""
        from tests.conftest import test_session_factory
        from sqlalchemy.exc import IntegrityError

        async with test_session_factory() as db:
            user = User(email="uc-dup-test@example.com", province_code="28")
            db.add(user)
            await db.commit()
            await db.refresh(user)

            report = CommunityReport(
                province_code="28",
                hazard_type="flood",
                severity=3,
                latitude=40.0,
                longitude=-3.5,
                expires_at=utcnow() + timedelta(hours=6),
                reporter_user_id=None,
            )
            db.add(report)
            await db.commit()
            await db.refresh(report)

            v1 = ReportVerification(report_id=report.id, user_id=user.id)
            db.add(v1)
            await db.commit()

            v2 = ReportVerification(report_id=report.id, user_id=user.id)
            db.add(v2)
            with pytest.raises(IntegrityError):
                await db.commit()
            await db.rollback()


class TestVerifyReport:
    """Tests for the verify_report service function."""

    @pytest.mark.asyncio
    async def test_first_verification_increments_count(self, client):
        """First verification by a user should increment verified_count."""
        from tests.conftest import test_session_factory

        async with test_session_factory() as db:
            reporter = User(email="vr-reporter@example.com", province_code="28")
            verifier = User(email="vr-verifier@example.com", province_code="28")
            db.add_all([reporter, verifier])
            await db.commit()
            await db.refresh(reporter)
            await db.refresh(verifier)

            report = CommunityReport(
                province_code="28",
                hazard_type="flood",
                severity=3,
                latitude=40.0,
                longitude=-3.5,
                expires_at=utcnow() + timedelta(hours=6),
                reporter_user_id=reporter.id,
            )
            db.add(report)
            await db.commit()
            await db.refresh(report)

            assert report.verified_count == 0

            result = await verify_report(db, report.id, verifier.id)
            assert result.verified_count == 1

            # Confirm a ReportVerification record was created
            stmt = select(ReportVerification).where(
                ReportVerification.report_id == report.id,
                ReportVerification.user_id == verifier.id,
            )
            row = (await db.execute(stmt)).scalar_one_or_none()
            assert row is not None

    @pytest.mark.asyncio
    async def test_duplicate_verification_raises_409(self, client):
        """Same user verifying the same report twice should raise HTTP 409."""
        from tests.conftest import test_session_factory
        from fastapi import HTTPException

        async with test_session_factory() as db:
            reporter = User(email="vr-dup-reporter@example.com", province_code="28")
            verifier = User(email="vr-dup-verifier@example.com", province_code="28")
            db.add_all([reporter, verifier])
            await db.commit()
            await db.refresh(reporter)
            await db.refresh(verifier)

            report = CommunityReport(
                province_code="28",
                hazard_type="flood",
                severity=3,
                latitude=40.0,
                longitude=-3.5,
                expires_at=utcnow() + timedelta(hours=6),
                reporter_user_id=reporter.id,
            )
            db.add(report)
            await db.commit()
            await db.refresh(report)

            # First verification succeeds
            await verify_report(db, report.id, verifier.id)

            # Second verification by same user raises 409
            with pytest.raises(HTTPException) as exc_info:
                await verify_report(db, report.id, verifier.id)
            assert exc_info.value.status_code == 409
            assert "Already verified" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_self_verification_raises_400(self, client):
        """A user should not be able to verify their own report (HTTP 400)."""
        from tests.conftest import test_session_factory
        from fastapi import HTTPException

        async with test_session_factory() as db:
            reporter = User(email="vr-self@example.com", province_code="28")
            db.add(reporter)
            await db.commit()
            await db.refresh(reporter)

            report = CommunityReport(
                province_code="28",
                hazard_type="fire",
                severity=4,
                latitude=40.0,
                longitude=-3.5,
                expires_at=utcnow() + timedelta(hours=6),
                reporter_user_id=reporter.id,
            )
            db.add(report)
            await db.commit()
            await db.refresh(report)

            with pytest.raises(HTTPException) as exc_info:
                await verify_report(db, report.id, reporter.id)
            assert exc_info.value.status_code == 400
            assert "Cannot verify your own report" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_auto_verify_at_three_verifications(self, client):
        """Report should auto-set is_verified=True when verified_count reaches 3."""
        from tests.conftest import test_session_factory

        async with test_session_factory() as db:
            reporter = User(email="vr-auto-reporter@example.com", province_code="28")
            db.add(reporter)
            await db.commit()
            await db.refresh(reporter)

            report = CommunityReport(
                province_code="28",
                hazard_type="flood",
                severity=3,
                latitude=40.0,
                longitude=-3.5,
                expires_at=utcnow() + timedelta(hours=6),
                reporter_user_id=reporter.id,
            )
            db.add(report)
            await db.commit()
            await db.refresh(report)

            verifiers = []
            for i in range(3):
                v = User(email=f"vr-auto-v{i}@example.com", province_code="28")
                db.add(v)
                verifiers.append(v)
            await db.commit()
            for v in verifiers:
                await db.refresh(v)

            # First two verifications: not yet auto-verified
            result = await verify_report(db, report.id, verifiers[0].id)
            assert result.verified_count == 1
            assert result.is_verified is False

            result = await verify_report(db, report.id, verifiers[1].id)
            assert result.verified_count == 2
            assert result.is_verified is False

            # Third verification triggers auto-verify
            result = await verify_report(db, report.id, verifiers[2].id)
            assert result.verified_count == 3
            assert result.is_verified is True
