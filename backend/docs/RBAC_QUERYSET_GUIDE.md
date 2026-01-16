# RBAC QuerySet Filtering Guide

## Overview

This guide explains how to use the reusable RBAC (Role-Based Access Control) QuerySet filtering system for Django REST Framework ViewSets. The system provides a declarative, DRY (Don't Repeat Yourself) approach to filtering querysets based on user roles.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Available Mixins](#available-mixins)
3. [Mixin Configuration](#mixin-configuration)
4. [Usage Examples](#usage-examples)
5. [Advanced Usage](#advanced-usage)
6. [Filter Utilities](#filter-utilities)
7. [Testing](#testing)
8. [Best Practices](#best-practices)

## Quick Start

### Basic Usage

```python
from apps.accounts.mixins import StatusBasedFilterMixin
from rest_framework import viewsets

class MyViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
    queryset = MyModel.objects.all()

    # Configure RBAC filtering
    rbac_status_field = 'is_active'
    rbac_status_value = True
    rbac_admin_sees_inactive = True
```

That's it! The mixin automatically filters the queryset based on user roles.

## Available Mixins

### 1. RBACQuerySetMixin (Base Class)

The base mixin that all other mixins inherit from. Provides core RBAC filtering functionality.

**Use When:** You need custom filtering logic for each role.

**Configuration:**

```python
from apps.accounts.mixins import RBACQuerySetMixin

class MyViewSet(RBACQuerySetMixin, viewsets.ModelViewSet):
    rbac_config = {
        'ADMIN': None,  # No filter, see all
        'SURVEYOR': Q(created_by='__request_user__'),
        'VIEWER': Q(is_public=True),
    }
    rbac_default_filter = Q(is_active=True)  # For unlisted roles
    rbac_admin_sees_all = True
    rbac_allow_superuser = True
```

**Attributes:**
- `rbac_config`: Dictionary mapping roles to Q objects
- `rbac_default_filter`: Default filter for roles not in config
- `rbac_admin_sees_all`: Whether ADMIN role sees all objects (default: True)
- `rbac_allow_superuser`: Whether superusers bypass filters (default: True)

### 2. OwnershipFilterMixin

For models with an ownership field (e.g., `created_by`).

**Use When:** Your model has a field that tracks who created/owns the object.

**Configuration:**

```python
from apps.accounts.mixins import OwnershipFilterMixin

class ServiceViewSet(OwnershipFilterMixin, viewsets.ModelViewSet):
    rbac_owner_field = 'created_by'  # Default: 'created_by'
    rbac_admin_sees_all = True
    rbac_non_owner_filter = Q(is_public=True)  # Non-owners see public items
    rbac_owner_can_see_own = True  # Owners can see their own items
```

**Attributes:**
- `rbac_owner_field`: Field name for ownership (default: 'created_by')
- `rbac_non_owner_filter`: Additional filter for non-owned items
- `rbac_owner_can_see_own`: Whether owners see their own items (default: True)

**Behavior:**
- **ADMIN**: Sees all objects
- **Others**: See own objects + objects matching `rbac_non_owner_filter`

### 3. SurveyorFilterMixin

Specifically designed for Survey models with verification workflow.

**Use When:** Your model has surveyor, verifier, and status fields (like the Survey model).

**Configuration:**

```python
from apps.accounts.mixins import SurveyorFilterMixin

class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    rbac_surveyor_field = 'surveyor'  # Default
    rbac_verifier_field = 'assigned_verifier'  # Default
    rbac_status_field = 'verification_status'  # Default
    rbac_verified_status = 'VERIFIED'  # Default
    rbac_submitted_status = 'SUBMITTED'  # Default
```

**Attributes:**
- `rbac_surveyor_field`: Field linking to surveyor user
- `rbac_verifier_field`: Field linking to verifier user
- `rbac_status_field`: Status field name
- `rbac_verified_status`: Value for verified status
- `rbac_submitted_status`: Value for submitted status

**Behavior:**
- **ADMIN**: Sees all surveys
- **SURVEYOR**: Sees own surveys (`surveyor=user`)
- **VERIFIER**: Sees assigned surveys OR submitted surveys
- **VIEWER**: Sees only verified surveys

### 4. UserActivityFilterMixin

For models that track user activity (logs, audit trails, etc.).

**Use When:** Your model logs user activities and has a `user` field.

**Configuration:**

```python
from apps.accounts.mixins import UserActivityFilterMixin

class ActivityLogViewSet(UserActivityFilterMixin, viewsets.ReadOnlyModelViewSet):
    rbac_user_field = 'user'  # Default
    rbac_admin_sees_all = True
    rbac_verifier_sees_all = True  # Verifiers see all logs
    rbac_viewer_sees_own = True  # Others see only own activity
```

**Attributes:**
- `rbac_user_field`: Field linking to user
- `rbac_verifier_sees_all`: Whether verifiers see all logs (default: False)
- `rbac_viewer_sees_own`: Whether viewers see their own logs (default: True)

**Behavior:**
- **ADMIN**: Sees all activity logs
- **VERIFIER**: Sees all logs (if `rbac_verifier_sees_all=True`)
- **Others**: See only their own activity

### 5. StatusBasedFilterMixin

For models with status/active fields.

**Use When:** Your model has an `is_active` or similar status field.

**Configuration:**

```python
from apps.accounts.mixins import StatusBasedFilterMixin

class ProductViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
    rbac_status_field = 'is_active'  # Default
    rbac_status_value = True  # Default
    rbac_admin_sees_inactive = True
    rbac_verifier_sees_inactive = False
```

**Attributes:**
- `rbac_status_field`: Status field name (default: 'is_active')
- `rbac_status_value`: Required value for status (default: True)
- `rbac_admin_sees_inactive`: Admin sees inactive items (default: True)
- `rbac_verifier_sees_inactive`: Verifier sees inactive items (default: False)

**Behavior:**
- **ADMIN**: Sees all objects (including inactive)
- **VERIFIER**: Sees all if `rbac_verifier_sees_inactive=True`, else only active
- **Others**: See only active/verified objects

### 6. CombinedRBACMixin

Combines multiple RBAC strategies.

**Use When:** You need to apply multiple filtering rules.

**Configuration:**

```python
from apps.accounts.mixins import CombinedRBACMixin

class MyViewSet(CombinedRBACMixin, viewsets.ModelViewSet):
    rbac_strategies = [
        ('ownership', {'owner_field': 'created_by'}),
        ('status', {'status_field': 'is_active', 'status_value': True}),
    ]
```

## Usage Examples

### Example 1: Survey ViewSet

```python
from apps.accounts.mixins import SurveyorFilterMixin
from rest_framework import viewsets

class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    """
    Survey ViewSet with automatic RBAC filtering

    Filtering behavior:
    - ADMIN: sees all surveys
    - SURVEYOR: sees own surveys
    - VERIFIER: sees assigned surveys + submitted surveys
    - VIEWER: sees verified surveys only
    """
    queryset = Survey.objects.select_related('surveyor', 'assigned_verifier')
    serializer_class = SurveySerializer

    # RBAC configuration (uses defaults)
    rbac_surveyor_field = 'surveyor'
    rbac_verifier_field = 'assigned_verifier'
    rbac_status_field = 'verification_status'
    rbac_verified_status = 'VERIFIED'
    rbac_submitted_status = 'SUBMITTED'
```

### Example 2: Service/Directory ViewSet

```python
from apps.accounts.mixins import StatusBasedFilterMixin
from rest_framework import viewsets

class ServiceViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
    """
    Service ViewSet with status-based filtering

    Filtering behavior:
    - ADMIN: sees all services (including inactive)
    - VERIFIER: sees all services
    - SURVEYOR/VIEWER: see only active services
    """
    queryset = Service.objects.select_related('created_by')
    serializer_class = ServiceSerializer

    # RBAC configuration
    rbac_status_field = 'is_active'
    rbac_status_value = True
    rbac_admin_sees_inactive = True
    rbac_verifier_sees_inactive = False
```

### Example 3: Activity Log ViewSet

```python
from apps.accounts.mixins import UserActivityFilterMixin
from rest_framework import viewsets

class ActivityLogViewSet(UserActivityFilterMixin, viewsets.ReadOnlyModelViewSet):
    """
    Activity Log ViewSet with user-based filtering

    Filtering behavior:
    - ADMIN: sees all activity logs
    - VERIFIER: sees all activity logs
    - SURVEYOR/VIEWER: see only their own activity
    """
    queryset = ActivityLog.objects.select_related('user')
    serializer_class = ActivityLogSerializer

    # RBAC configuration
    rbac_user_field = 'user'
    rbac_admin_sees_all = True
    rbac_verifier_sees_all = True
    rbac_viewer_sees_own = True
```

### Example 4: User ViewSet

```python
from apps.accounts.mixins import StatusBasedFilterMixin
from rest_framework import viewsets

class UserViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
    """
    User ViewSet with active status filtering

    Filtering behavior:
    - ADMIN: sees all users (including inactive)
    - VERIFIER/SURVEYOR/VIEWER: see only active users
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

    # RBAC configuration
    rbac_status_field = 'is_active'
    rbac_status_value = True
    rbac_admin_sees_inactive = True
    rbac_verifier_sees_inactive = False
```

## Advanced Usage

### Custom Q Object Filters

You can use the base `RBACQuerySetMixin` with custom Q objects:

```python
from django.db.models import Q
from apps.accounts.mixins import RBACQuerySetMixin

class MyViewSet(RBACQuerySetMixin, viewsets.ModelViewSet):
    rbac_config = {
        'ADMIN': None,  # See all
        'SURVEYOR': Q(created_by='__request_user__') | Q(is_public=True),
        'VERIFIER': Q(status='SUBMITTED') | Q(assigned_to='__request_user__'),
        'VIEWER': Q(status='PUBLISHED') & Q(is_public=True),
    }
```

**Note:** Use `'__request_user__'` as a placeholder for the current user. The mixin will replace it with the actual user instance.

### Using Filter Utilities

```python
from apps.accounts.filters import (
    RBACRule, RBACConfig, RBACFilterBuilder,
    apply_rbac_to_queryset
)

# Method 1: Using RBACConfig
config = RBACConfig(
    admin=RBACRule.all(),
    surveyor=RBACRule.owned_by('surveyor'),
    verifier=RBACRule.any([
        RBACRule.assigned_to('assigned_verifier'),
        RBACRule.status_equals('SUBMITTED', 'verification_status')
    ]),
    viewer=RBACRule.status_equals('VERIFIED', 'verification_status')
)

# Apply to queryset
filtered_queryset = apply_rbac_to_queryset(
    Survey.objects.all(),
    request.user,
    config
)

# Method 2: Using RBACFilterBuilder
builder = RBACFilterBuilder()
builder.for_role('ADMIN').allow_all()
builder.for_role('SURVEYOR').filter_by_ownership('surveyor')
builder.for_role('VIEWER').filter_by_status('VERIFIED', 'verification_status')
rules = builder.build()
```

### Decorator-Based Filtering

```python
from apps.accounts.mixins import rbac_queryset_filter
from django.db.models import Q

class MyViewSet(viewsets.ModelViewSet):

    @rbac_queryset_filter({
        'ADMIN': None,
        'SURVEYOR': Q(surveyor='__request_user__'),
        'VIEWER': Q(is_public=True),
    })
    def get_queryset(self):
        return MyModel.objects.all()
```

### Checking Object Access

```python
from apps.accounts.filters import user_can_access_object, RBACConfig

# Check if user can access specific object
config = RBACConfig(
    admin=RBACRule.all(),
    surveyor=RBACRule.owned_by('created_by'),
    viewer=RBACRule.status_equals('ACTIVE')
)

can_access = user_can_access_object(obj, request.user, config)
```

### Getting Accessible IDs

```python
from apps.accounts.filters import get_accessible_ids

# Get list of object IDs user can access
accessible_ids = get_accessible_ids(
    Survey,
    request.user,
    config
)
```

## Testing

### Testing ViewSet Filtering

```python
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User

class SurveyRBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()

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

    def test_surveyor_sees_own_surveys(self):
        """Surveyor should only see their own surveys"""
        self.client.force_authenticate(user=self.surveyor)
        response = self.client.get('/api/survey/surveys/')

        # All surveys should belong to this surveyor
        for survey in response.data['results']:
            self.assertEqual(survey['surveyor'], self.surveyor.id)

    def test_admin_sees_all_surveys(self):
        """Admin should see all surveys"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/survey/surveys/')

        # Should see surveys from all users
        self.assertGreater(len(response.data['results']), 0)
```

## Best Practices

### 1. Choose the Right Mixin

- **SurveyorFilterMixin**: For survey/verification workflows
- **OwnershipFilterMixin**: For created_by relationships
- **UserActivityFilterMixin**: For activity/audit logs
- **StatusBasedFilterMixin**: For is_active or status fields
- **RBACQuerySetMixin**: For custom filtering logic

### 2. Always Configure Mixin Attributes

```python
class MyViewSet(SomeFilterMixin, viewsets.ModelViewSet):
    # Always set these even if using defaults
    rbac_admin_sees_all = True
    rbac_allow_superuser = True
    # ... other config
```

### 3. Document Filtering Behavior

```python
class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    """
    Survey ViewSet

    RBAC Filtering:
    - ADMIN: sees all surveys
    - SURVEYOR: sees own surveys
    - VERIFIER: sees assigned + submitted surveys
    - VIEWER: sees verified surveys only
    """
```

### 4. Combine with Permissions

Mixins filter querysets, but you still need permissions for actions:

```python
from apps.accounts.permissions import IsSurveyorOrAdmin, CanModifySurveyStatus

class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action == 'create':
            return [IsSurveyorOrAdmin()]
        elif self.action == 'verify':
            return [CanModifySurveyStatus()]
        return [IsAuthenticated()]
```

### 5. Test Each Role

Always test filtering for each role:
- ADMIN (sees all)
- SURVEYOR (sees own)
- VERIFIER (sees assigned/submitted)
- VIEWER (sees verified/public)

### 6. Performance Considerations

Use `select_related` and `prefetch_related` to optimize queries:

```python
class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    queryset = Survey.objects.select_related(
        'surveyor',
        'assigned_verifier',
        'service'
    ).prefetch_related(
        'attachments'
    )
```

## Migration Guide

### Before (Manual Filtering)

```python
class SurveyViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.role == 'ADMIN':
            return queryset
        elif user.role == 'SURVEYOR':
            return queryset.filter(surveyor=user)
        elif user.role == 'VERIFIER':
            return queryset.filter(
                Q(assigned_verifier=user) |
                Q(verification_status='SUBMITTED')
            )
        else:
            return queryset.filter(verification_status='VERIFIED')
```

### After (With Mixin)

```python
class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    rbac_surveyor_field = 'surveyor'
    rbac_verifier_field = 'assigned_verifier'
    rbac_status_field = 'verification_status'
    rbac_verified_status = 'VERIFIED'
    rbac_submitted_status = 'SUBMITTED'

    # That's it! No get_queryset() needed
```

## Related Files

- [apps/accounts/mixins.py](apps/accounts/mixins.py) - Mixin implementations
- [apps/accounts/filters.py](apps/accounts/filters.py) - Filter utilities
- [apps/survey/views.py](apps/survey/views.py) - Survey ViewSet example
- [apps/directory/views.py](apps/directory/views.py) - Service ViewSet example
- [apps/logs/views.py](apps/logs/views.py) - Activity Log example
- [RBAC_SECURITY.md](RBAC_SECURITY.md) - Overall RBAC documentation

## FAQ

**Q: Can I override get_queryset() in my ViewSet?**
A: Yes, but you need to call super():

```python
def get_queryset(self):
    queryset = super().get_queryset()  # This applies RBAC
    # Add your custom filtering
    return queryset.filter(custom_field=value)
```

**Q: What if my model doesn't fit any mixin?**
A: Use the base `RBACQuerySetMixin` with custom Q objects.

**Q: Can I disable filtering for specific actions?**
A: Override `get_queryset()` and check `self.action`:

```python
def get_queryset(self):
    if self.action == 'special_action':
        return MyModel.objects.all()  # No RBAC
    return super().get_queryset()  # Apply RBAC
```

**Q: How do I test the mixins?**
A: See the [Testing](#testing) section above.

**Q: Can I use multiple mixins?**
A: Python MRO (Method Resolution Order) means only the first mixin's get_queryset() will be called. Use `CombinedRBACMixin` or create a custom mixin.

## Summary

The RBAC QuerySet filtering system provides:
- **DRY Code**: No repetitive filtering logic
- **Type Safety**: Clear mixin configurations
- **Flexibility**: Multiple mixins for different patterns
- **Testability**: Easy to test filtering behavior
- **Performance**: Optimized queryset filtering
- **Security**: Consistent RBAC enforcement

Choose the right mixin, configure it, and let the system handle the rest!
