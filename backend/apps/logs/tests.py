from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import ActivityLog, SystemError, ImportExportLog

User = get_user_model()


class ActivityLogTests(TestCase):
    """Test cases for ActivityLog model"""

    def setUp(self):
        self.user = User.objects.create_user(email='testuser@example.com', password='pass')

    def test_create_activity_log(self):
        """Test creating an activity log"""
        log = ActivityLog.objects.create(
            user=self.user,
            username=self.user.email,
            action=ActivityLog.Action.LOGIN,
            severity=ActivityLog.Severity.INFO,
            description='User logged in'
        )
        
        self.assertEqual(log.action, ActivityLog.Action.LOGIN)
        self.assertEqual(log.severity, ActivityLog.Severity.INFO)


class SystemErrorTests(TestCase):
    """Test cases for SystemError model"""

    def test_create_system_error(self):
        """Test creating a system error"""
        error = SystemError.objects.create(
            severity=SystemError.Severity.ERROR,
            error_type=SystemError.ErrorType.DATABASE,
            error_message='Database connection failed'
        )
        
        self.assertEqual(error.severity, SystemError.Severity.ERROR)
        self.assertFalse(error.is_resolved)
        self.assertEqual(error.occurrence_count, 1)


class ImportExportLogTests(TestCase):
    """Test cases for ImportExportLog model"""

    def setUp(self):
        self.user = User.objects.create_user(email='testuser@example.com', password='pass')

    def test_create_import_log(self):
        """Test creating an import log"""
        log = ImportExportLog.objects.create(
            operation=ImportExportLog.Operation.IMPORT,
            status=ImportExportLog.Status.COMPLETED,
            user=self.user,
            username=self.user.email,
            model_name='Service',
            file_format=ImportExportLog.Format.CSV,
            file_name='services.csv',
            total_records=100,
            successful_records=95,
            failed_records=5
        )
        
        self.assertEqual(log.success_rate, 95.0)
