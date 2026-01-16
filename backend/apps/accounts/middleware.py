"""
RBAC Middleware for validating user access to resources
Provides additional security layer beyond Django REST Framework permissions
"""

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
import re


class RBACValidationMiddleware(MiddlewareMixin):
    """
    Middleware to validate RBAC rules for API endpoints
    Ensures users can only access data they have permission to view
    """

    # Define role-based access rules for specific URL patterns
    ROLE_ACCESS_RULES = {
        # Admin-only endpoints
        r'^/api/accounts/users/': {
            'GET': ['ADMIN', 'VERIFIER', 'SURVEYOR', 'VIEWER'],  # List users
            'POST': ['ADMIN'],  # Create user
            'PUT': ['ADMIN'],  # Update user
            'PATCH': ['ADMIN'],  # Partial update
            'DELETE': ['ADMIN'],  # Delete user
        },
        r'^/api/accounts/users/\d+/set_role/': {
            'POST': ['ADMIN'],  # Only admin can change roles
        },
        r'^/api/accounts/users/\d+/deactivate/': {
            'POST': ['ADMIN'],  # Only admin can deactivate users
        },
        r'^/api/logs/audit/': {
            'GET': ['ADMIN', 'VERIFIER'],  # Audit logs for admin and verifier
            'POST': ['ADMIN'],
            'PUT': ['ADMIN'],
            'PATCH': ['ADMIN'],
            'DELETE': ['ADMIN'],
        },
        r'^/api/logs/audit/\d+/resolve/': {
            'POST': ['ADMIN'],  # Only admin can resolve audit logs
        },
        r'^/api/logs/changes/': {
            'GET': ['ADMIN', 'VERIFIER'],  # Change logs
        },
        r'^/api/logs/errors/': {
            'GET': ['ADMIN', 'VERIFIER'],  # Error logs
        },
        r'^/api/directory/services/': {
            'GET': ['ADMIN', 'SURVEYOR', 'VERIFIER', 'VIEWER'],  # All can view
            'POST': ['ADMIN', 'SURVEYOR'],  # Admin and surveyor can create
            'PUT': ['ADMIN', 'SURVEYOR'],  # Admin and surveyor can update
            'PATCH': ['ADMIN', 'SURVEYOR'],
            'DELETE': ['ADMIN'],  # Only admin can delete
        },
        r'^/api/survey/surveys/': {
            'GET': ['ADMIN', 'SURVEYOR', 'VERIFIER', 'VIEWER'],  # All can view (filtered by get_queryset)
            'POST': ['ADMIN', 'SURVEYOR'],  # Only surveyor and admin can create
            'PUT': ['ADMIN', 'SURVEYOR'],  # Update own surveys
            'PATCH': ['ADMIN', 'SURVEYOR'],
            'DELETE': ['ADMIN'],  # Only admin can delete
        },
        r'^/api/survey/surveys/\d+/verify/': {
            'POST': ['ADMIN', 'VERIFIER'],  # Only verifier and admin can verify
        },
        r'^/api/survey/surveys/\d+/submit/': {
            'POST': ['ADMIN', 'SURVEYOR'],  # Only surveyor can submit own surveys
        },
        r'^/api/analytics/': {
            'GET': ['ADMIN', 'VERIFIER', 'VIEWER'],  # Analytics accessible to viewers+
        },
    }

    # Endpoints that bypass RBAC checks (public or specially handled)
    BYPASS_ENDPOINTS = [
        r'^/api/accounts/auth/',  # Authentication endpoints
        r'^/api/accounts/profile/',  # User's own profile
        r'^/admin/',  # Django admin (has its own auth)
        r'^/static/',  # Static files
        r'^/media/',  # Media files
    ]

    def process_request(self, request):
        """
        Validate user access before processing the request
        """
        # Skip if not an API request or if DEBUG mode is off
        if not request.path.startswith('/api/'):
            return None

        # Skip for bypassed endpoints
        for pattern in self.BYPASS_ENDPOINTS:
            if re.match(pattern, request.path):
                return None

        # Skip for unauthenticated requests (handled by DRF permissions)
        if not request.user or not request.user.is_authenticated:
            return None

        # Superusers bypass all checks
        if request.user.is_superuser:
            return None

        # Check role-based access rules
        method = request.method
        path = request.path
        user_role = getattr(request.user, 'role', None)

        for url_pattern, rules in self.ROLE_ACCESS_RULES.items():
            if re.match(url_pattern, path):
                allowed_roles = rules.get(method, [])

                if not allowed_roles:
                    # Method not explicitly allowed for this endpoint
                    continue

                if user_role not in allowed_roles:
                    return JsonResponse({
                        'detail': f'Your role ({user_role}) does not have permission to {method} this resource.',
                        'required_roles': allowed_roles,
                    }, status=403)

        return None


class ResourceOwnershipMiddleware(MiddlewareMixin):
    """
    Middleware to validate resource ownership
    Ensures users can only modify resources they own (unless they're admin)
    """

    # URL patterns that require ownership validation
    OWNERSHIP_PATTERNS = {
        r'^/api/survey/surveys/\d+/$': {
            'model': 'survey.Survey',
            'owner_field': 'surveyor',
            'exempt_roles': ['ADMIN'],
            'methods': ['PUT', 'PATCH', 'DELETE'],
        },
        r'^/api/directory/services/\d+/$': {
            'model': 'directory.Service',
            'owner_field': 'created_by',
            'exempt_roles': ['ADMIN'],
            'methods': ['PUT', 'PATCH', 'DELETE'],
        },
    }

    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Validate ownership before the view is executed
        Note: This is a simplified implementation.
        The actual ownership check is better handled in DRF permissions (has_object_permission)
        This middleware serves as an additional security layer
        """
        # This middleware is primarily for logging and can be extended
        # The actual ownership validation is handled by DRF's object-level permissions
        return None


class RateLimitByRoleMiddleware(MiddlewareMixin):
    """
    Middleware to implement role-based rate limiting
    Different roles have different rate limits
    """

    RATE_LIMITS = {
        'ADMIN': 1000,  # requests per minute
        'VERIFIER': 500,
        'SURVEYOR': 300,
        'VIEWER': 100,
    }

    def process_request(self, request):
        """
        Apply rate limiting based on user role
        Note: This is a placeholder. For production, use Django REST Framework's throttling
        or a dedicated rate limiting solution like django-ratelimit
        """
        # This is a simplified implementation
        # In production, use DRF throttling or django-ratelimit
        return None
