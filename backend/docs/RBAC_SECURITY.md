# RBAC Security Implementation

## Overview

This document describes the Role-Based Access Control (RBAC) implementation in the Yakkum backend. The system provides multi-layered security validation to ensure users can only access data they have permission to view or modify.

## Security Layers

### 1. Middleware Layer ([apps/accounts/middleware.py](apps/accounts/middleware.py))

**RBACValidationMiddleware** - Validates role-based access at the HTTP request level before reaching the view.

Features:
- URL pattern-based role validation
- HTTP method-specific permissions
- Pre-emptive rejection of unauthorized requests
- Custom error messages with required roles

Example:
```python
# Only ADMIN and VERIFIER can access audit logs
r'^/api/logs/audit/': {
    'GET': ['ADMIN', 'VERIFIER'],
    'POST': ['ADMIN'],
    'DELETE': ['ADMIN'],
}
```

### 2. Permission Classes Layer ([apps/accounts/permissions.py](apps/accounts/permissions.py))

Django REST Framework permission classes that provide both view-level and object-level permissions.

#### View-Level Permissions

- **IsAdmin** - Admin users only
- **IsSurveyor** - Surveyor users only
- **IsVerifier** - Verifier users only
- **IsViewer** - Viewer users only
- **IsSurveyorOrAdmin** - Surveyor or Admin
- **IsVerifierOrAdmin** - Verifier or Admin

#### Object-Level Permissions

- **CanAccessUserData** - Validates user can access another user's data
  - Users can access their own data
  - Admins can access all user data
  - Verifiers can view surveyor data for assigned surveys

- **CanAccessServiceData** - Validates access to service/directory data
  - All users can read
  - Admins can do anything
  - Surveyors can edit services they created
  - Verifiers can only read

- **CanAccessAuditLog** - Validates access to audit logs
  - Only Admin and Verifier can access
  - Verifiers see only logs related to their assigned surveys
  - Admins see all logs

- **CanModifySurveyStatus** - Validates survey status changes
  - Admins can modify any status
  - Surveyors can submit their own draft surveys
  - Verifiers can verify/reject assigned submitted surveys

- **IsSurveyOwnerOrReadOnly** - Survey ownership validation
  - Read permissions for all authenticated users
  - Surveyors can edit their own surveys
  - Verifiers can verify assigned surveys
  - Admins can do anything

### 3. QuerySet Filtering Layer (View Methods)

Views implement `get_queryset()` to filter data based on user roles.

Example from [apps/survey/views.py](apps/survey/views.py:67-84):
```python
def get_queryset(self):
    user = self.request.user
    queryset = super().get_queryset()

    if user.role == 'ADMIN':
        return queryset
    elif user.role == 'SURVEYOR':
        # Surveyors see their own surveys
        return queryset.filter(surveyor=user)
    elif user.role == 'VERIFIER':
        # Verifiers see assigned surveys and submitted ones
        return queryset.filter(
            Q(assigned_verifier=user) |
            Q(verification_status=Survey.Status.SUBMITTED)
        )
    else:
        # Viewers see only verified surveys
        return queryset.filter(verification_status=Survey.Status.VERIFIED)
```

## Role Hierarchy and Permissions

### ADMIN
- **Full Access**: Can access and modify all data
- **User Management**: Create, update, deactivate users, change roles
- **Service Management**: Create, update, delete services
- **Survey Management**: View all surveys, modify any survey, assign verifiers
- **Audit Logs**: Full access to all logs
- **Analytics**: Full access

### VERIFIER
- **Survey Verification**: Verify/reject assigned surveys
- **View Access**: View assigned surveys and submitted surveys
- **Audit Logs**: View logs related to their verification activities
- **Service Data**: Read-only access
- **Analytics**: View analytics data

### SURVEYOR
- **Survey Creation**: Create and submit surveys
- **Service Management**: Create and update services they created
- **Own Data**: Edit their own surveys and services
- **Submit Surveys**: Submit draft surveys for verification
- **View Access**: View their own surveys and services

### VIEWER
- **Read-Only**: View verified surveys only
- **Analytics**: View analytics dashboards
- **Service Data**: Read-only access to verified services
- **No Modifications**: Cannot create or edit any data

## Implementation Examples

### Protecting a ViewSet

```python
from apps.accounts.permissions import (
    IsSurveyorOrAdmin,
    CanAccessServiceData
)

class ServiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create']:
            return [IsSurveyorOrAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Can modify if admin or owner
            return [IsSurveyorOrAdmin(), CanAccessServiceData()]
        return [IsAuthenticated()]

    def get_queryset(self):
        # Filter data based on role
        user = self.request.user
        if user.role == 'ADMIN':
            return Service.objects.all()
        return Service.objects.filter(is_active=True)
```

### Adding Custom Actions with Permissions

```python
@action(detail=True, methods=['post'])
def verify(self, request, pk=None):
    """Verify a survey - Only verifiers and admins"""
    # Permission checked by CanModifySurveyStatus
    survey = self.get_object()
    # Verify logic here

def get_permissions(self):
    if self.action == 'verify':
        return [IsVerifierOrAdmin(), CanModifySurveyStatus()]
    return super().get_permissions()
```

## Security Best Practices

### 1. Always Use Multiple Layers
Combine middleware, permissions, and queryset filtering:
- Middleware blocks unauthorized requests early
- Permissions provide fine-grained control
- Queryset filtering ensures data isolation

### 2. Check Object Ownership
Always validate ownership in object-level permissions:
```python
def has_object_permission(self, request, view, obj):
    if request.user.role == 'ADMIN':
        return True
    return obj.created_by == request.user
```

### 3. Filter QuerySets by Role
Never expose all data - always filter based on role:
```python
def get_queryset(self):
    user = self.request.user
    if user.role != 'ADMIN':
        return self.queryset.filter(created_by=user)
    return self.queryset
```

### 4. Validate Status Transitions
Check both role AND current state:
```python
def has_object_permission(self, request, view, obj):
    if view.action == 'submit':
        return (
            obj.surveyor == request.user and
            obj.verification_status == Survey.Status.DRAFT
        )
```

### 5. Use Explicit Permissions
Prefer explicit permission checks over implicit ones:
```python
# Good - Explicit
if self.action == 'verify':
    return [IsVerifierOrAdmin(), CanModifySurveyStatus()]

# Bad - Implicit
if self.action == 'verify':
    return [IsAuthenticated()]  # Too permissive!
```

## Testing Permissions

### Manual Testing Checklist

1. **User Access**
   - ✓ Users can access their own data
   - ✓ Users cannot access other users' data (unless admin)
   - ✓ Admins can access all user data

2. **Service Access**
   - ✓ All authenticated users can view services
   - ✓ Only surveyors/admins can create services
   - ✓ Only owners/admins can modify services
   - ✓ Only admins can delete services

3. **Survey Access**
   - ✓ Surveyors see only their surveys
   - ✓ Verifiers see assigned surveys + submitted surveys
   - ✓ Viewers see only verified surveys
   - ✓ Admins see all surveys

4. **Survey Status Changes**
   - ✓ Surveyors can submit draft surveys
   - ✓ Surveyors cannot submit non-draft surveys
   - ✓ Verifiers can verify assigned surveys
   - ✓ Verifiers cannot verify unassigned surveys
   - ✓ Admins can change any status

5. **Audit Logs**
   - ✓ Only admins and verifiers can access audit logs
   - ✓ Verifiers see only relevant logs
   - ✓ Admins see all logs

### Test with Different Roles

```bash
# Test as Surveyor
curl -H "Authorization: Bearer <surveyor_token>" \
  http://localhost:8000/api/survey/surveys/

# Test as Verifier
curl -H "Authorization: Bearer <verifier_token>" \
  http://localhost:8000/api/survey/surveys/

# Test unauthorized access
curl -H "Authorization: Bearer <viewer_token>" \
  -X POST http://localhost:8000/api/survey/surveys/
# Should return 403 Forbidden
```

## Common Errors and Solutions

### 403 Forbidden
**Cause**: User's role doesn't have permission for the requested action
**Solution**: Check role requirements in middleware rules and permission classes

### 404 Not Found (When Data Exists)
**Cause**: Data filtered out by `get_queryset()` due to ownership/role
**Solution**: Verify user has access to the specific object

### 401 Unauthorized
**Cause**: User not authenticated or token expired
**Solution**: Check authentication token

## Middleware Configuration

The RBAC middleware is registered in [core/settings.py](core/settings.py:68):

```python
MIDDLEWARE = [
    # ... other middleware ...
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # RBAC validation middleware - Add after authentication
    'apps.accounts.middleware.RBACValidationMiddleware',
]
```

## Adding New Protected Endpoints

1. **Add URL pattern to middleware** (if needed for early validation):
```python
# apps/accounts/middleware.py
ROLE_ACCESS_RULES = {
    r'^/api/newapp/resource/': {
        'GET': ['ADMIN', 'VERIFIER'],
        'POST': ['ADMIN'],
    },
}
```

2. **Create permission class** (if custom logic needed):
```python
# apps/accounts/permissions.py
class CanAccessNewResource(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Custom validation logic
        pass
```

3. **Apply to ViewSet**:
```python
class NewResourceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanAccessNewResource]

    def get_queryset(self):
        # Filter by role
        pass
```

## Security Audit Checklist

- [ ] All ViewSets have permission_classes defined
- [ ] Object-level permissions implemented for modify operations
- [ ] QuerySets filtered by user role
- [ ] Status transitions validated
- [ ] Ownership checks in place
- [ ] Middleware rules cover sensitive endpoints
- [ ] No hardcoded permissions in views
- [ ] Permission denied returns proper error messages

## Related Files

- [apps/accounts/models.py](apps/accounts/models.py) - User model with roles
- [apps/accounts/permissions.py](apps/accounts/permissions.py) - Permission classes
- [apps/accounts/middleware.py](apps/accounts/middleware.py) - RBAC middleware
- [apps/survey/views.py](apps/survey/views.py) - Survey permissions example
- [apps/directory/views.py](apps/directory/views.py) - Service permissions example
- [core/settings.py](core/settings.py) - Middleware configuration
