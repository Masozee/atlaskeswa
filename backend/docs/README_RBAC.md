# RBAC System - Quick Reference

## 🚀 Quick Start

### Using RBAC Mixins in Your ViewSet

```python
from apps.accounts.mixins import SurveyorFilterMixin
from rest_framework import viewsets

class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer

    # Configure the mixin
    rbac_surveyor_field = 'surveyor'
    rbac_verifier_field = 'assigned_verifier'
    rbac_status_field = 'verification_status'

    # Done! Automatic RBAC filtering is now applied
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [RBAC_QUERYSET_GUIDE.md](RBAC_QUERYSET_GUIDE.md) | **Start Here** - Complete guide to using RBAC mixins |
| [RBAC_SECURITY.md](RBAC_SECURITY.md) | Security implementation overview |
| [RBAC_IMPLEMENTATION_SUMMARY.md](RBAC_IMPLEMENTATION_SUMMARY.md) | Implementation details and statistics |

## 🎯 Choose Your Mixin

| Your Model Has... | Use This Mixin | Example |
|-------------------|----------------|---------|
| `surveyor`, `assigned_verifier`, `status` | `SurveyorFilterMixin` | Survey model |
| `created_by` field | `OwnershipFilterMixin` | Service, Article |
| `user` field (activity logs) | `UserActivityFilterMixin` | ActivityLog |
| `is_active` or `status` field | `StatusBasedFilterMixin` | User, Service |
| Custom complex logic | `RBACQuerySetMixin` | Custom models |

## 🔧 Available Mixins

### 1. SurveyorFilterMixin
For survey verification workflows:
- ADMIN: sees all
- SURVEYOR: sees own surveys
- VERIFIER: sees assigned + submitted
- VIEWER: sees verified only

```python
class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    rbac_surveyor_field = 'surveyor'
    rbac_verifier_field = 'assigned_verifier'
    rbac_status_field = 'verification_status'
```

### 2. StatusBasedFilterMixin
For active/inactive filtering:
- ADMIN: sees all (including inactive)
- Others: see only active

```python
class ServiceViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
    rbac_status_field = 'is_active'
    rbac_status_value = True
    rbac_admin_sees_inactive = True
```

### 3. UserActivityFilterMixin
For activity/audit logs:
- ADMIN: sees all logs
- VERIFIER: sees all logs (configurable)
- Others: see only own logs

```python
class ActivityLogViewSet(UserActivityFilterMixin, viewsets.ReadOnlyModelViewSet):
    rbac_user_field = 'user'
    rbac_admin_sees_all = True
    rbac_verifier_sees_all = True
```

### 4. OwnershipFilterMixin
For created_by relationships:
- ADMIN: sees all
- Others: see own + public items

```python
class ArticleViewSet(OwnershipFilterMixin, viewsets.ModelViewSet):
    rbac_owner_field = 'created_by'
    rbac_non_owner_filter = Q(is_public=True)
```

### 5. RBACQuerySetMixin
For custom filtering logic:

```python
class MyViewSet(RBACQuerySetMixin, viewsets.ModelViewSet):
    rbac_config = {
        'ADMIN': None,  # See all
        'SURVEYOR': Q(created_by='__request_user__'),
        'VIEWER': Q(is_public=True),
    }
```

## 🧪 Testing

```bash
# Run RBAC tests
python manage.py test apps.accounts.tests_rbac

# Run mixin tests
python manage.py test apps.accounts.tests_mixins

# Run all RBAC tests
python manage.py test apps.accounts.tests_rbac apps.accounts.tests_mixins
```

## 📝 Example ViewSets

### Survey ViewSet
```python
from apps.accounts.mixins import SurveyorFilterMixin

class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    """
    Survey ViewSet with automatic RBAC filtering

    Filtering:
    - ADMIN: all surveys
    - SURVEYOR: own surveys
    - VERIFIER: assigned + submitted surveys
    - VIEWER: verified surveys only
    """
    queryset = Survey.objects.select_related('surveyor', 'assigned_verifier')
    serializer_class = SurveySerializer

    rbac_surveyor_field = 'surveyor'
    rbac_verifier_field = 'assigned_verifier'
    rbac_status_field = 'verification_status'
    rbac_verified_status = 'VERIFIED'
    rbac_submitted_status = 'SUBMITTED'
```

### Service ViewSet
```python
from apps.accounts.mixins import StatusBasedFilterMixin

class ServiceViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
    """
    Service ViewSet with status-based filtering

    Filtering:
    - ADMIN: all services (including inactive)
    - VERIFIER: all services
    - Others: active services only
    """
    queryset = Service.objects.select_related('created_by')
    serializer_class = ServiceSerializer

    rbac_status_field = 'is_active'
    rbac_status_value = True
    rbac_admin_sees_inactive = True
    rbac_verifier_sees_inactive = False
```

### Activity Log ViewSet
```python
from apps.accounts.mixins import UserActivityFilterMixin

class ActivityLogViewSet(UserActivityFilterMixin, viewsets.ReadOnlyModelViewSet):
    """
    Activity Log ViewSet with user-based filtering

    Filtering:
    - ADMIN: all logs
    - VERIFIER: all logs
    - Others: own logs only
    """
    queryset = ActivityLog.objects.select_related('user')
    serializer_class = ActivityLogSerializer

    rbac_user_field = 'user'
    rbac_admin_sees_all = True
    rbac_verifier_sees_all = True
    rbac_viewer_sees_own = True
```

## 🛠️ Advanced Usage

### Using Filter Utilities

```python
from apps.accounts.filters import RBACRule, RBACConfig

# Define rules
config = RBACConfig(
    admin=RBACRule.all(),
    surveyor=RBACRule.owned_by('surveyor'),
    verifier=RBACRule.any([
        RBACRule.assigned_to('assigned_verifier'),
        RBACRule.status_equals('SUBMITTED')
    ]),
    viewer=RBACRule.status_equals('VERIFIED')
)

# Apply to queryset
from apps.accounts.filters import apply_rbac_to_queryset

filtered = apply_rbac_to_queryset(
    Survey.objects.all(),
    request.user,
    config
)
```

### Using Builder Pattern

```python
from apps.accounts.filters import RBACFilterBuilder

builder = RBACFilterBuilder()
config = (builder
          .for_role('ADMIN').allow_all()
          .for_role('SURVEYOR').filter_by_ownership('surveyor')
          .for_role('VERIFIER').filter_by_assignment('assigned_verifier')
          .for_role('VIEWER').filter_by_status('VERIFIED')
          .build())
```

## 🔒 Security Layers

The RBAC system provides 3 layers of security:

1. **Middleware** - Early validation at request level
2. **Permissions** - View and object-level permissions
3. **QuerySet Filtering** - Data isolation by role

## 📋 Checklist for New ViewSet

- [ ] Choose appropriate mixin
- [ ] Add mixin to class inheritance
- [ ] Configure mixin attributes
- [ ] Remove manual `get_queryset()` if exists
- [ ] Add permissions to `get_permissions()`
- [ ] Document filtering behavior in docstring
- [ ] Write tests for each role
- [ ] Use `select_related`/`prefetch_related` for performance

## ⚡ Performance Tips

```python
class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    # Optimize with select_related/prefetch_related
    queryset = Survey.objects.select_related(
        'surveyor',
        'assigned_verifier',
        'service'
    ).prefetch_related(
        'attachments',
        'audit_logs'
    )
```

## 🐛 Troubleshooting

### Issue: Users see no data

**Cause:** Too restrictive filtering

**Solution:** Check mixin configuration and user role

```python
# Debug in Django shell
from django.contrib.auth import get_user_model
User = get_user_model()

user = User.objects.get(email='test@test.com')
print(f"Role: {user.role}")

# Check what user can see
from apps.survey.models import Survey
accessible = Survey.objects.filter(surveyor=user)
print(f"Accessible surveys: {accessible.count()}")
```

### Issue: Admin sees filtered data

**Cause:** `rbac_admin_sees_all = False`

**Solution:** Set to `True`

```python
class MyViewSet(SomeFilterMixin, viewsets.ModelViewSet):
    rbac_admin_sees_all = True  # Make sure this is True
```

### Issue: 403 Forbidden errors

**Cause:** Missing permissions or middleware blocking

**Solution:** Check permissions and middleware rules

```python
# Check permissions
def get_permissions(self):
    if self.action == 'create':
        return [IsSurveyorOrAdmin()]
    return [IsAuthenticated()]
```

## 📖 Common Patterns

### Read-Only for Non-Owners

```python
class MyViewSet(OwnershipFilterMixin, viewsets.ModelViewSet):
    rbac_owner_field = 'created_by'
    rbac_non_owner_filter = Q(is_public=True)
    rbac_owner_can_see_own = True
```

### Different Filters per Role

```python
class MyViewSet(RBACQuerySetMixin, viewsets.ModelViewSet):
    rbac_config = {
        'ADMIN': None,
        'SURVEYOR': Q(created_by='__request_user__') | Q(is_template=True),
        'VIEWER': Q(is_public=True),
    }
```

### Status + Ownership Combined

```python
class MyViewSet(CombinedRBACMixin, viewsets.ModelViewSet):
    rbac_strategies = [
        ('ownership', {'owner_field': 'created_by'}),
        ('status', {'status_field': 'is_active', 'status_value': True}),
    ]
```

## 🎓 Learning Path

1. **Start with [RBAC_QUERYSET_GUIDE.md](RBAC_QUERYSET_GUIDE.md)**
2. **Read example ViewSets** in apps/survey, apps/directory
3. **Look at mixin source code** in apps/accounts/mixins.py
4. **Study tests** in apps/accounts/tests_mixins.py
5. **Try implementing** in your own ViewSet
6. **Review [RBAC_SECURITY.md](RBAC_SECURITY.md)** for security best practices

## 🤝 Contributing

When adding new RBAC features:

1. Add tests to `tests_mixins.py`
2. Update `RBAC_QUERYSET_GUIDE.md`
3. Add example to this README
4. Ensure all tests pass

## 📦 Files Structure

```
backend/
├── apps/
│   └── accounts/
│       ├── mixins.py          # Mixin classes
│       ├── filters.py         # Filter utilities
│       ├── middleware.py      # RBAC middleware
│       ├── permissions.py     # Permission classes
│       ├── tests_rbac.py      # RBAC tests
│       └── tests_mixins.py    # Mixin tests
├── RBAC_QUERYSET_GUIDE.md     # Usage guide
├── RBAC_SECURITY.md           # Security overview
├── RBAC_IMPLEMENTATION_SUMMARY.md  # Implementation details
└── README_RBAC.md             # This file
```

## 🔗 Quick Links

- **[Full Usage Guide](RBAC_QUERYSET_GUIDE.md)** - Complete documentation
- **[Security Guide](RBAC_SECURITY.md)** - Security implementation
- **[Implementation Summary](RBAC_IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[Mixins Source](apps/accounts/mixins.py)** - Mixin implementations
- **[Filters Source](apps/accounts/filters.py)** - Filter utilities
- **[Tests](apps/accounts/tests_mixins.py)** - Unit tests

## ✅ Summary

The RBAC mixin system provides:

- ✅ **DRY Code** - No duplication
- ✅ **Type Safety** - Clear configurations
- ✅ **Security** - Multi-layer defense
- ✅ **Testability** - Comprehensive tests
- ✅ **Performance** - Database-level filtering
- ✅ **Maintainability** - Easy to understand

**Need help?** Read the [Full Guide](RBAC_QUERYSET_GUIDE.md) or check the examples!
