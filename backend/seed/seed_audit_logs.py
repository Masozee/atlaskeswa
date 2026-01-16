"""
Seed script to add audit logs for existing surveys without damaging data.
This creates audit trail history for surveys based on their current status.
Run with: python seed/seed_audit_logs.py (from backend directory)
"""

import os
import sys
import django
from datetime import datetime, timedelta
from random import choice, randint

# Add parent directory to path so 'core' module can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.survey.models import Survey, SurveyAuditLog
from apps.accounts.models import User

def seed_audit_logs():
    """Create audit logs for existing surveys"""

    print("=== Starting Audit Log Seeding ===")

    # Get users for audit logs
    admins = list(User.objects.filter(role='ADMIN'))
    surveyors = list(User.objects.filter(role='SURVEYOR'))
    verifiers = list(User.objects.filter(role='VERIFIER'))

    if not admins or not surveyors or not verifiers:
        print("ERROR: Need at least one ADMIN, SURVEYOR, and VERIFIER user")
        return

    created_count = 0

    for survey in Survey.objects.all():
        # Skip if already has audit logs
        if SurveyAuditLog.objects.filter(survey=survey).exists():
            print(f"Survey {survey.id} already has audit logs, skipping...")
            continue

        # Calculate timestamps based on survey dates
        base_date = survey.created_at if hasattr(survey, 'created_at') else datetime.now()

        # 1. CREATED log (by surveyor or admin)
        creator = survey.surveyor if survey.surveyor else choice(surveyors)
        created_log = SurveyAuditLog.objects.create(
            survey=survey,
            action=SurveyAuditLog.Action.CREATED,
            user=creator,
            previous_status='',
            new_status=Survey.Status.DRAFT,
            notes='Survey created',
            timestamp=base_date
        )
        created_count += 1

        # 2. If survey was updated (add update log)
        if randint(1, 3) == 1:  # 33% chance of having an update
            update_time = base_date + timedelta(hours=randint(1, 24))
            SurveyAuditLog.objects.create(
                survey=survey,
                action=SurveyAuditLog.Action.UPDATED,
                user=creator,
                previous_status=Survey.Status.DRAFT,
                new_status=Survey.Status.DRAFT,
                notes='Survey data updated',
                timestamp=update_time
            )
            created_count += 1

        # 3. If survey is SUBMITTED, VERIFIED, or REJECTED
        if survey.verification_status != Survey.Status.DRAFT:
            submit_time = base_date + timedelta(days=randint(1, 3))

            SurveyAuditLog.objects.create(
                survey=survey,
                action=SurveyAuditLog.Action.SUBMITTED,
                user=creator,
                previous_status=Survey.Status.DRAFT,
                new_status=Survey.Status.SUBMITTED,
                notes='Submitted for verification',
                timestamp=submit_time
            )
            created_count += 1

            # 4. If assigned to verifier
            if survey.assigned_verifier:
                assign_time = submit_time + timedelta(hours=randint(1, 12))
                SurveyAuditLog.objects.create(
                    survey=survey,
                    action=SurveyAuditLog.Action.ASSIGNED,
                    user=choice(admins),
                    previous_status=Survey.Status.SUBMITTED,
                    new_status=Survey.Status.SUBMITTED,
                    notes=f'Assigned to {survey.assigned_verifier.email}',
                    timestamp=assign_time
                )
                created_count += 1

        # 5. If VERIFIED
        if survey.verification_status == Survey.Status.VERIFIED:
            verify_time = submit_time + timedelta(days=randint(1, 5))
            verifier = survey.verified_by if survey.verified_by else choice(verifiers)

            SurveyAuditLog.objects.create(
                survey=survey,
                action=SurveyAuditLog.Action.VERIFIED,
                user=verifier,
                previous_status=Survey.Status.SUBMITTED,
                new_status=Survey.Status.VERIFIED,
                notes=survey.verifier_notes or 'Survey verified and approved',
                timestamp=verify_time
            )
            created_count += 1

        # 6. If REJECTED
        if survey.verification_status == Survey.Status.REJECTED:
            reject_time = submit_time + timedelta(days=randint(1, 5))
            verifier = choice(verifiers)

            SurveyAuditLog.objects.create(
                survey=survey,
                action=SurveyAuditLog.Action.REJECTED,
                user=verifier,
                previous_status=Survey.Status.SUBMITTED,
                new_status=Survey.Status.REJECTED,
                notes=survey.rejection_reason or 'Survey rejected - please review',
                timestamp=reject_time
            )
            created_count += 1

    print(f"\n✓ Created {created_count} audit log entries")
    print(f"✓ Total audit logs in database: {SurveyAuditLog.objects.count()}")

def print_summary():
    """Print summary of audit logs"""
    print("\n=== Audit Log Summary ===")

    from django.db.models import Count

    action_counts = SurveyAuditLog.objects.values('action').annotate(count=Count('id'))
    for action in action_counts:
        print(f"{action['action']}: {action['count']}")

    print(f"\nSurveys with audit logs: {Survey.objects.filter(auditlog__isnull=False).distinct().count()}")
    print(f"Surveys without audit logs: {Survey.objects.filter(auditlog__isnull=True).count()}")

if __name__ == '__main__':
    seed_audit_logs()
    print_summary()
    print("\n✓ Audit log seeding completed successfully!")
