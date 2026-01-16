from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from .models import UserActivityLog

User = get_user_model()


class UserModelTests(TestCase):
    """Test cases for the custom User model"""

    def setUp(self):
        """Set up test data"""
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'role': User.Role.SURVEYOR,
            'phone_number': '+1234567890',
            'organization': 'Test Organization'
        }

    def test_create_user(self):
        """Test creating a new user"""
        user = User.objects.create_user(**self.user_data)

        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.username, 'test')  # Auto-generated from email
        self.assertEqual(user.role, User.Role.SURVEYOR)
        self.assertEqual(user.phone_number, '+1234567890')
        self.assertEqual(user.organization, 'Test Organization')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """Test creating a superuser"""
        superuser = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )

        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_active)
        self.assertEqual(superuser.username, 'admin')  # Auto-generated

    def test_user_str_with_full_name(self):
        """Test user string representation with full name"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role=User.Role.ADMIN
        )

        self.assertEqual(str(user), 'John Doe (Administrator)')

    def test_user_str_without_full_name(self):
        """Test user string representation without full name"""
        user = User.objects.create_user(**self.user_data)

        self.assertEqual(str(user), 'test@example.com (Surveyor/Enumerator)')

    def test_user_default_role(self):
        """Test that default role is VIEWER"""
        user = User.objects.create_user(
            email='viewer@example.com',
            password='viewerpass123'
        )

        self.assertEqual(user.role, User.Role.VIEWER)

    def test_user_role_choices(self):
        """Test all user role choices"""
        roles = [User.Role.ADMIN, User.Role.SURVEYOR, User.Role.VERIFIER, User.Role.VIEWER]

        for role in roles:
            user = User.objects.create_user(
                email=f'{role}@example.com',
                password='testpass123',
                role=role
            )
            self.assertEqual(user.role, role)

    def test_user_timestamps(self):
        """Test that timestamps are created"""
        user = User.objects.create_user(**self.user_data)

        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)

    def test_user_avatar_optional(self):
        """Test that avatar is optional"""
        user = User.objects.create_user(**self.user_data)

        self.assertFalse(user.avatar)


class UserActivityLogTests(TestCase):
    """Test cases for UserActivityLog model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_activity_log(self):
        """Test creating an activity log"""
        log = UserActivityLog.objects.create(
            user=self.user,
            action=UserActivityLog.Action.LOGIN,
            model_name='User',
            object_id=self.user.id,
            description='User logged in',
            ip_address='127.0.0.1',
            user_agent='Mozilla/5.0'
        )

        self.assertEqual(log.user, self.user)
        self.assertEqual(log.action, UserActivityLog.Action.LOGIN)
        self.assertEqual(log.model_name, 'User')
        self.assertEqual(log.object_id, self.user.id)
        self.assertEqual(log.description, 'User logged in')
        self.assertEqual(log.ip_address, '127.0.0.1')

    def test_activity_log_str(self):
        """Test activity log string representation"""
        log = UserActivityLog.objects.create(
            user=self.user,
            action=UserActivityLog.Action.CREATE,
            description='Created new record'
        )

        self.assertIn(self.user.username, str(log))
        self.assertIn('Create', str(log))

    def test_activity_log_ordering(self):
        """Test that logs are ordered by timestamp descending"""
        log1 = UserActivityLog.objects.create(
            user=self.user,
            action=UserActivityLog.Action.LOGIN,
            description='First log'
        )
        log2 = UserActivityLog.objects.create(
            user=self.user,
            action=UserActivityLog.Action.LOGOUT,
            description='Second log'
        )

        logs = UserActivityLog.objects.all()
        self.assertEqual(logs[0], log2)  # Most recent first
        self.assertEqual(logs[1], log1)

    def test_activity_log_all_actions(self):
        """Test all action choices"""
        actions = [
            UserActivityLog.Action.LOGIN,
            UserActivityLog.Action.LOGOUT,
            UserActivityLog.Action.CREATE,
            UserActivityLog.Action.UPDATE,
            UserActivityLog.Action.DELETE,
            UserActivityLog.Action.VIEW,
            UserActivityLog.Action.EXPORT
        ]

        for action in actions:
            log = UserActivityLog.objects.create(
                user=self.user,
                action=action,
                description=f'Testing {action}'
            )
            self.assertEqual(log.action, action)

    def test_activity_log_cascade_delete(self):
        """Test that logs are deleted when user is deleted"""
        log = UserActivityLog.objects.create(
            user=self.user,
            action=UserActivityLog.Action.LOGIN,
            description='Test log'
        )

        user_id = self.user.id
        self.user.delete()

        # Log should be deleted
        self.assertFalse(UserActivityLog.objects.filter(user_id=user_id).exists())


class UserAuthenticationTests(TestCase):
    """Test cases for user authentication"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role=User.Role.ADMIN
        )

    def test_user_can_authenticate(self):
        """Test that user can authenticate with correct credentials using email"""
        from django.contrib.auth import authenticate

        user = authenticate(username='test@example.com', password='testpass123')
        self.assertIsNotNone(user)
        self.assertEqual(user.email, 'test@example.com')

    def test_user_cannot_authenticate_wrong_password(self):
        """Test that authentication fails with wrong password"""
        from django.contrib.auth import authenticate

        user = authenticate(username='test@example.com', password='wrongpassword')
        self.assertIsNone(user)

    def test_inactive_user_cannot_authenticate(self):
        """Test that inactive users cannot authenticate"""
        from django.contrib.auth import authenticate

        self.user.is_active = False
        self.user.save()

        user = authenticate(username='test@example.com', password='testpass123')
        self.assertIsNone(user)


class UserManagerTests(TestCase):
    """Test cases for custom User manager"""

    def test_create_user_without_email(self):
        """Test that creating user without email raises error"""
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='testpass123')

    def test_create_superuser_requires_is_staff(self):
        """Test that superuser must have is_staff=True"""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass123',
                is_staff=False
            )

    def test_create_superuser_requires_is_superuser(self):
        """Test that superuser must have is_superuser=True"""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass123',
                is_superuser=False
            )

    def test_username_auto_generated_from_email(self):
        """Test that username is automatically generated from email"""
        user = User.objects.create_user(
            email='john.doe@example.com',
            password='testpass123'
        )

        self.assertEqual(user.username, 'john.doe')

    def test_username_unique_when_duplicate(self):
        """Test that username gets number suffix when duplicate"""
        user1 = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

        user2 = User.objects.create_user(
            email='test@different.com',
            password='testpass123'
        )

        self.assertEqual(user1.username, 'test')
        self.assertEqual(user2.username, 'test1')
