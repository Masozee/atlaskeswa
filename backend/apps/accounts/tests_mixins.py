"""
Unit tests for RBAC QuerySet Mixins
Tests all mixin classes and filter utilities
"""

from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.test import APIRequestFactory
from rest_framework import viewsets

from apps.accounts.mixins import (
    RBACQuerySetMixin,
    OwnershipFilterMixin,
    SurveyorFilterMixin,
    UserActivityFilterMixin,
    StatusBasedFilterMixin,
)
from apps.accounts.filters import (
    RBACRule,
    RBACConfig,
    RBACFilterBuilder,
    apply_rbac_to_queryset,
    get_accessible_ids,
    user_can_access_object,
)

User = get_user_model()


class RBACQuerySetMixinTests(TestCase):
    """Test RBACQuerySetMixin base class"""

    def setUp(self):
        """Create test users with different roles"""
        self.factory = APIRequestFactory()

        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            role='ADMIN'
        )

        self.surveyor = User.objects.create_user(
            email='surveyor@test.com',
            password='test123',
            role='SURVEYOR'
        )

        self.verifier = User.objects.create_user(
            email='verifier@test.com',
            password='test123',
            role='VERIFIER'
        )

        self.viewer = User.objects.create_user(
            email='viewer@test.com',
            password='test123',
            role='VIEWER'
        )

    def test_get_rbac_filter_for_role(self):
        """Test getting filter for specific role"""
        class TestViewSet(RBACQuerySetMixin, viewsets.ModelViewSet):
            rbac_config = {
                'ADMIN': None,
                'SURVEYOR': Q(is_active=True),
            }
            rbac_default_filter = Q(is_public=True)

        viewset = TestViewSet()

        # Admin should have no filter
        self.assertIsNone(viewset.get_rbac_filter_for_role('ADMIN'))

        # Surveyor should have is_active filter
        filter_q = viewset.get_rbac_filter_for_role('SURVEYOR')
        self.assertIsInstance(filter_q, Q)

        # Unknown role should get default filter
        filter_q = viewset.get_rbac_filter_for_role('UNKNOWN')
        self.assertIsInstance(filter_q, Q)

    def test_admin_sees_all_when_configured(self):
        """Test that admin sees all when rbac_admin_sees_all=True"""
        class TestViewSet(RBACQuerySetMixin, viewsets.ModelViewSet):
            queryset = User.objects.all()
            rbac_admin_sees_all = True

        viewset = TestViewSet()
        request = self.factory.get('/')
        request.user = self.admin
        viewset.request = request

        queryset = viewset.apply_rbac_filter(viewset.queryset, self.admin)
        # Admin should see all users
        self.assertEqual(queryset.count(), 4)

    def test_superuser_bypasses_filters(self):
        """Test that superusers bypass all filters"""
        superuser = User.objects.create_superuser(
            email='super@test.com',
            password='test123'
        )

        class TestViewSet(RBACQuerySetMixin, viewsets.ModelViewSet):
            queryset = User.objects.all()
            rbac_allow_superuser = True
            rbac_default_filter = Q(is_active=False)  # Would return empty

        viewset = TestViewSet()
        queryset = viewset.apply_rbac_filter(viewset.queryset, superuser)
        # Superuser should see all (5 users now)
        self.assertEqual(queryset.count(), 5)


class OwnershipFilterMixinTests(TestCase):
    """Test OwnershipFilterMixin"""

    def setUp(self):
        """Create test users"""
        self.factory = APIRequestFactory()

        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            role='ADMIN'
        )

        self.user1 = User.objects.create_user(
            email='user1@test.com',
            password='test123',
            role='SURVEYOR'
        )

        self.user2 = User.objects.create_user(
            email='user2@test.com',
            password='test123',
            role='SURVEYOR'
        )

    def test_admin_sees_all_users(self):
        """Admin should see all users"""
        class TestViewSet(OwnershipFilterMixin, viewsets.ModelViewSet):
            queryset = User.objects.all()
            rbac_owner_field = 'created_by'
            rbac_admin_sees_all = True

        viewset = TestViewSet()
        queryset = viewset.apply_rbac_filter(viewset.queryset, self.admin)

        # Admin sees all users
        self.assertEqual(queryset.count(), 3)

    def test_owner_can_see_own(self):
        """Test that owner_can_see_own works"""
        # This test would require a model with created_by field
        # Skipping for now as User model doesn't have created_by
        pass


class SurveyorFilterMixinTests(TestCase):
    """Test SurveyorFilterMixin"""

    def setUp(self):
        """Create test users"""
        self.factory = APIRequestFactory()

        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            role='ADMIN'
        )

        self.surveyor = User.objects.create_user(
            email='surveyor@test.com',
            password='test123',
            role='SURVEYOR'
        )

        self.verifier = User.objects.create_user(
            email='verifier@test.com',
            password='test123',
            role='VERIFIER'
        )

        self.viewer = User.objects.create_user(
            email='viewer@test.com',
            password='test123',
            role='VIEWER'
        )

    def test_surveyor_role_configuration(self):
        """Test that SurveyorFilterMixin has correct default configuration"""
        class TestViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
            pass

        viewset = TestViewSet()

        self.assertEqual(viewset.rbac_surveyor_field, 'surveyor')
        self.assertEqual(viewset.rbac_verifier_field, 'assigned_verifier')
        self.assertEqual(viewset.rbac_status_field, 'verification_status')
        self.assertEqual(viewset.rbac_verified_status, 'VERIFIED')
        self.assertEqual(viewset.rbac_submitted_status, 'SUBMITTED')


class UserActivityFilterMixinTests(TestCase):
    """Test UserActivityFilterMixin"""

    def setUp(self):
        """Create test users"""
        self.factory = APIRequestFactory()

        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            role='ADMIN'
        )

        self.verifier = User.objects.create_user(
            email='verifier@test.com',
            password='test123',
            role='VERIFIER'
        )

        self.viewer = User.objects.create_user(
            email='viewer@test.com',
            password='test123',
            role='VIEWER'
        )

    def test_admin_sees_all_activity(self):
        """Admin should see all activity logs"""
        class TestViewSet(UserActivityFilterMixin, viewsets.ReadOnlyModelViewSet):
            queryset = User.objects.all()
            rbac_user_field = 'id'  # Use id as proxy for user field
            rbac_admin_sees_all = True

        viewset = TestViewSet()
        queryset = viewset.apply_rbac_filter(viewset.queryset, self.admin)

        # Admin sees all
        self.assertEqual(queryset.count(), 3)

    def test_verifier_sees_all_when_configured(self):
        """Verifier should see all when rbac_verifier_sees_all=True"""
        class TestViewSet(UserActivityFilterMixin, viewsets.ReadOnlyModelViewSet):
            queryset = User.objects.all()
            rbac_user_field = 'id'
            rbac_admin_sees_all = True
            rbac_verifier_sees_all = True

        viewset = TestViewSet()
        queryset = viewset.apply_rbac_filter(viewset.queryset, self.verifier)

        # Verifier sees all
        self.assertEqual(queryset.count(), 3)

    def test_viewer_sees_own_only(self):
        """Viewer should see only their own activity"""
        class TestViewSet(UserActivityFilterMixin, viewsets.ReadOnlyModelViewSet):
            queryset = User.objects.all()
            rbac_user_field = 'id'
            rbac_admin_sees_all = True
            rbac_verifier_sees_all = True
            rbac_viewer_sees_own = True

        viewset = TestViewSet()
        queryset = viewset.apply_rbac_filter(viewset.queryset, self.viewer)

        # Viewer sees only themselves
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first().id, self.viewer.id)


class StatusBasedFilterMixinTests(TestCase):
    """Test StatusBasedFilterMixin"""

    def setUp(self):
        """Create test users"""
        self.factory = APIRequestFactory()

        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            role='ADMIN',
            is_active=True
        )

        self.inactive_user = User.objects.create_user(
            email='inactive@test.com',
            password='test123',
            role='VIEWER',
            is_active=False
        )

        self.active_user = User.objects.create_user(
            email='active@test.com',
            password='test123',
            role='VIEWER',
            is_active=True
        )

    def test_admin_sees_inactive_when_configured(self):
        """Admin should see inactive users when rbac_admin_sees_inactive=True"""
        class TestViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
            queryset = User.objects.all()
            rbac_status_field = 'is_active'
            rbac_status_value = True
            rbac_admin_sees_inactive = True

        viewset = TestViewSet()
        queryset = viewset.apply_rbac_filter(viewset.queryset, self.admin)

        # Admin sees all (3 users)
        self.assertEqual(queryset.count(), 3)

    def test_viewer_sees_active_only(self):
        """Viewer should see only active users"""
        class TestViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
            queryset = User.objects.all()
            rbac_status_field = 'is_active'
            rbac_status_value = True
            rbac_admin_sees_inactive = True
            rbac_verifier_sees_inactive = False

        viewset = TestViewSet()
        queryset = viewset.apply_rbac_filter(viewset.queryset, self.active_user)

        # Viewer sees only active users (2 users)
        self.assertEqual(queryset.count(), 2)
        self.assertTrue(all(user.is_active for user in queryset))


class RBACRuleTests(TestCase):
    """Test RBACRule class"""

    def setUp(self):
        """Create test user"""
        self.user = User.objects.create_user(
            email='test@test.com',
            password='test123',
            role='SURVEYOR'
        )

    def test_rule_all(self):
        """Test RBACRule.all()"""
        rule = RBACRule.all()
        self.assertEqual(rule.filter_type, 'all')
        self.assertIsNone(rule.to_q())

    def test_rule_none(self):
        """Test RBACRule.none()"""
        rule = RBACRule.none()
        self.assertEqual(rule.filter_type, 'none')
        q = rule.to_q()
        self.assertIsInstance(q, Q)

    def test_rule_owned_by(self):
        """Test RBACRule.owned_by()"""
        rule = RBACRule.owned_by('created_by')
        self.assertEqual(rule.filter_type, 'owned_by')
        self.assertEqual(rule.field_name, 'created_by')

        q = rule.to_q(user=self.user)
        self.assertIsInstance(q, Q)

    def test_rule_field_equals(self):
        """Test RBACRule.field_equals()"""
        rule = RBACRule.field_equals('status', 'ACTIVE')
        self.assertEqual(rule.filter_type, 'field_equals')
        self.assertEqual(rule.field_name, 'status')
        self.assertEqual(rule.field_value, 'ACTIVE')

        q = rule.to_q()
        self.assertIsInstance(q, Q)

    def test_rule_status_equals(self):
        """Test RBACRule.status_equals()"""
        rule = RBACRule.status_equals('VERIFIED', 'verification_status')
        self.assertEqual(rule.filter_type, 'status')
        self.assertEqual(rule.field_name, 'verification_status')
        self.assertEqual(rule.field_value, 'VERIFIED')

    def test_rule_any(self):
        """Test RBACRule.any() combines with OR"""
        rule1 = RBACRule.field_equals('status', 'ACTIVE')
        rule2 = RBACRule.field_equals('is_public', True)

        combined = RBACRule.any([rule1, rule2])
        self.assertEqual(combined.filter_type, 'custom')
        self.assertIsInstance(combined.q_object, Q)

    def test_rule_all_of(self):
        """Test RBACRule.all_of() combines with AND"""
        rule1 = RBACRule.field_equals('status', 'ACTIVE')
        rule2 = RBACRule.field_equals('is_verified', True)

        combined = RBACRule.all_of([rule1, rule2])
        self.assertEqual(combined.filter_type, 'custom')
        self.assertIsInstance(combined.q_object, Q)


class RBACConfigTests(TestCase):
    """Test RBACConfig class"""

    def test_config_creation(self):
        """Test creating RBACConfig"""
        config = RBACConfig(
            admin=RBACRule.all(),
            surveyor=RBACRule.owned_by('surveyor'),
            viewer=RBACRule.status_equals('VERIFIED')
        )

        self.assertIsInstance(config.admin, RBACRule)
        self.assertIsInstance(config.surveyor, RBACRule)
        self.assertIsInstance(config.viewer, RBACRule)

    def test_get_rule_for_role(self):
        """Test getting rule for specific role"""
        config = RBACConfig(
            admin=RBACRule.all(),
            surveyor=RBACRule.owned_by('surveyor'),
        )

        admin_rule = config.get_rule_for_role('ADMIN')
        self.assertEqual(admin_rule.filter_type, 'all')

        surveyor_rule = config.get_rule_for_role('SURVEYOR')
        self.assertEqual(surveyor_rule.filter_type, 'owned_by')

    def test_to_dict(self):
        """Test converting config to dictionary"""
        config = RBACConfig(
            admin=RBACRule.all(),
            surveyor=RBACRule.owned_by('surveyor'),
        )

        config_dict = config.to_dict()
        self.assertIn('ADMIN', config_dict)
        self.assertIn('SURVEYOR', config_dict)
        self.assertIn('VERIFIER', config_dict)
        self.assertIn('VIEWER', config_dict)


class RBACFilterBuilderTests(TestCase):
    """Test RBACFilterBuilder class"""

    def test_builder_basic(self):
        """Test basic builder usage"""
        builder = RBACFilterBuilder()
        builder.for_role('ADMIN').allow_all()
        builder.for_role('VIEWER').deny_all()

        rules = builder.build()

        self.assertIn('ADMIN', rules)
        self.assertIn('VIEWER', rules)
        self.assertEqual(rules['ADMIN'].filter_type, 'all')
        self.assertEqual(rules['VIEWER'].filter_type, 'none')

    def test_builder_ownership(self):
        """Test builder with ownership filter"""
        builder = RBACFilterBuilder()
        builder.for_role('SURVEYOR').filter_by_ownership('created_by')

        rules = builder.build()

        self.assertEqual(rules['SURVEYOR'].filter_type, 'owned_by')
        self.assertEqual(rules['SURVEYOR'].field_name, 'created_by')

    def test_builder_status(self):
        """Test builder with status filter"""
        builder = RBACFilterBuilder()
        builder.for_role('VIEWER').filter_by_status('VERIFIED', 'verification_status')

        rules = builder.build()

        self.assertEqual(rules['VIEWER'].filter_type, 'status')
        self.assertEqual(rules['VIEWER'].field_name, 'verification_status')
        self.assertEqual(rules['VIEWER'].field_value, 'VERIFIED')

    def test_builder_chaining(self):
        """Test builder method chaining"""
        builder = RBACFilterBuilder()
        config = (builder
                  .for_role('ADMIN').allow_all()
                  .for_role('VIEWER').deny_all()
                  .build())

        self.assertEqual(len(config), 2)


class ApplyRBACToQuerySetTests(TestCase):
    """Test apply_rbac_to_queryset utility function"""

    def setUp(self):
        """Create test users"""
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            role='ADMIN'
        )

        self.surveyor = User.objects.create_user(
            email='surveyor@test.com',
            password='test123',
            role='SURVEYOR'
        )

        self.active_user = User.objects.create_user(
            email='active@test.com',
            password='test123',
            role='VIEWER',
            is_active=True
        )

        self.inactive_user = User.objects.create_user(
            email='inactive@test.com',
            password='test123',
            role='VIEWER',
            is_active=False
        )

    def test_apply_rbac_with_dict(self):
        """Test applying RBAC with dictionary of rules"""
        rules = {
            'ADMIN': RBACRule.all(),
            'SURVEYOR': RBACRule.field_equals('is_active', True),
        }

        # Admin sees all
        queryset = apply_rbac_to_queryset(
            User.objects.all(),
            self.admin,
            rules
        )
        self.assertEqual(queryset.count(), 4)

        # Surveyor sees only active
        queryset = apply_rbac_to_queryset(
            User.objects.all(),
            self.surveyor,
            rules
        )
        self.assertEqual(queryset.count(), 3)
        self.assertTrue(all(user.is_active for user in queryset))

    def test_apply_rbac_with_config(self):
        """Test applying RBAC with RBACConfig"""
        config = RBACConfig(
            admin=RBACRule.all(),
            surveyor=RBACRule.field_equals('is_active', True),
        )

        # Admin sees all
        queryset = apply_rbac_to_queryset(
            User.objects.all(),
            self.admin,
            config
        )
        self.assertEqual(queryset.count(), 4)

    def test_unauthenticated_user(self):
        """Test that unauthenticated user gets empty queryset"""
        rules = {'ADMIN': RBACRule.all()}

        queryset = apply_rbac_to_queryset(
            User.objects.all(),
            None,
            rules
        )

        self.assertEqual(queryset.count(), 0)


class GetAccessibleIDsTests(TestCase):
    """Test get_accessible_ids utility function"""

    def setUp(self):
        """Create test users"""
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            role='ADMIN'
        )

        self.user1 = User.objects.create_user(
            email='user1@test.com',
            password='test123',
            role='VIEWER',
            is_active=True
        )

        self.user2 = User.objects.create_user(
            email='user2@test.com',
            password='test123',
            role='VIEWER',
            is_active=False
        )

    def test_get_accessible_ids(self):
        """Test getting accessible IDs for a user"""
        rules = {
            'ADMIN': RBACRule.all(),
            'VIEWER': RBACRule.field_equals('is_active', True),
        }

        # Admin can access all IDs
        admin_ids = get_accessible_ids(User, self.admin, rules)
        self.assertEqual(len(admin_ids), 3)

        # Viewer can only access active user IDs
        viewer_ids = get_accessible_ids(User, self.user1, rules)
        self.assertEqual(len(viewer_ids), 2)
        self.assertIn(self.admin.id, viewer_ids)
        self.assertIn(self.user1.id, viewer_ids)
        self.assertNotIn(self.user2.id, viewer_ids)


class UserCanAccessObjectTests(TestCase):
    """Test user_can_access_object utility function"""

    def setUp(self):
        """Create test users"""
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            role='ADMIN'
        )

        self.active_user = User.objects.create_user(
            email='active@test.com',
            password='test123',
            role='VIEWER',
            is_active=True
        )

        self.inactive_user = User.objects.create_user(
            email='inactive@test.com',
            password='test123',
            role='VIEWER',
            is_active=False
        )

    def test_admin_can_access_any_object(self):
        """Admin should be able to access any object"""
        rules = {
            'ADMIN': RBACRule.all(),
            'VIEWER': RBACRule.field_equals('is_active', True),
        }

        # Admin can access inactive user
        can_access = user_can_access_object(self.inactive_user, self.admin, rules)
        self.assertTrue(can_access)

    def test_viewer_cannot_access_inactive(self):
        """Viewer should not be able to access inactive users"""
        rules = {
            'ADMIN': RBACRule.all(),
            'VIEWER': RBACRule.field_equals('is_active', True),
        }

        # Viewer cannot access inactive user
        can_access = user_can_access_object(self.inactive_user, self.active_user, rules)
        self.assertFalse(can_access)

        # Viewer can access active user
        can_access = user_can_access_object(self.active_user, self.active_user, rules)
        self.assertTrue(can_access)
