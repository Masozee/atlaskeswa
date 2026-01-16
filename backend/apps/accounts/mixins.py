"""
RBAC QuerySet Filtering Mixins
Reusable mixins for applying role-based access control to Django querysets
"""

from django.db.models import Q
from typing import Optional, Dict, Any, Callable
from functools import wraps


class RBACQuerySetMixin:
    """
    Base mixin for role-based queryset filtering

    Usage:
        class MyViewSet(RBACQuerySetMixin, viewsets.ModelViewSet):
            rbac_config = {
                'ADMIN': None,  # No filter, see all
                'SURVEYOR': Q(created_by=F('request_user')),
                'VIEWER': Q(is_active=True),
            }
            rbac_default_filter = Q(is_active=True)  # Default for unlisted roles
    """

    # Configuration attributes (override in subclass)
    rbac_config: Dict[str, Optional[Q]] = {}
    rbac_default_filter: Optional[Q] = None
    rbac_admin_sees_all: bool = True
    rbac_allow_superuser: bool = True

    def get_rbac_filter_for_role(self, role: str) -> Optional[Q]:
        """
        Get the Q filter for a specific role

        Args:
            role: User role string (e.g., 'ADMIN', 'SURVEYOR')

        Returns:
            Q object for filtering or None for no filtering
        """
        if role in self.rbac_config:
            return self.rbac_config[role]
        return self.rbac_default_filter

    def apply_rbac_filter(self, queryset, user):
        """
        Apply RBAC filtering to the queryset based on user role

        Args:
            queryset: Django QuerySet to filter
            user: User object with role attribute

        Returns:
            Filtered QuerySet
        """
        # Superusers bypass all filters
        if self.rbac_allow_superuser and user.is_superuser:
            return queryset

        # Get user role
        role = getattr(user, 'role', None)
        if not role:
            # User has no role, apply default filter or return empty
            if self.rbac_default_filter:
                return queryset.filter(self.rbac_default_filter)
            return queryset.none()

        # Admin sees all (if configured)
        if self.rbac_admin_sees_all and role == 'ADMIN':
            return queryset

        # Get filter for role
        filter_q = self.get_rbac_filter_for_role(role)

        if filter_q is None:
            # No filter means see all
            return queryset

        # Apply filter with user context
        filter_q = self._resolve_user_references(filter_q, user)
        return queryset.filter(filter_q)

    def _resolve_user_references(self, q_object: Q, user) -> Q:
        """
        Resolve special user references in Q objects
        Replaces placeholders with actual user instance
        """
        # This is a simplified implementation
        # For complex cases, consider using a more sophisticated resolver
        if not hasattr(q_object, 'children'):
            return q_object

        new_children = []
        for child in q_object.children:
            if isinstance(child, tuple):
                key, value = child
                # Replace user placeholder with actual user
                if value == '__request_user__':
                    new_children.append((key, user))
                else:
                    new_children.append(child)
            elif isinstance(child, Q):
                new_children.append(self._resolve_user_references(child, user))
            else:
                new_children.append(child)

        q_object.children = new_children
        return q_object

    def get_queryset(self):
        """
        Override get_queryset to apply RBAC filtering
        """
        queryset = super().get_queryset()

        # Apply RBAC filter if user is authenticated
        if hasattr(self, 'request') and hasattr(self.request, 'user'):
            user = self.request.user
            if user and user.is_authenticated:
                queryset = self.apply_rbac_filter(queryset, user)

        return queryset


class OwnershipFilterMixin(RBACQuerySetMixin):
    """
    Mixin for models with ownership field (e.g., created_by)

    Usage:
        class ServiceViewSet(OwnershipFilterMixin, viewsets.ModelViewSet):
            rbac_owner_field = 'created_by'
            rbac_admin_sees_all = True
            rbac_non_owner_filter = Q(is_active=True)  # Non-owners see only active
    """

    rbac_owner_field: str = 'created_by'
    rbac_non_owner_filter: Optional[Q] = None
    rbac_owner_can_see_own: bool = True

    def apply_rbac_filter(self, queryset, user):
        """Apply ownership-based filtering"""
        # Superusers bypass all filters
        if self.rbac_allow_superuser and user.is_superuser:
            return queryset

        role = getattr(user, 'role', None)

        # Admin sees all
        if self.rbac_admin_sees_all and role == 'ADMIN':
            return queryset

        # Build filter based on ownership
        filters = Q()

        # Owner sees their own items
        if self.rbac_owner_can_see_own:
            owner_filter = {self.rbac_owner_field: user}
            filters |= Q(**owner_filter)

        # Add additional filters for non-owned items
        if self.rbac_non_owner_filter:
            filters |= self.rbac_non_owner_filter

        return queryset.filter(filters) if filters else queryset.none()


class SurveyorFilterMixin(RBACQuerySetMixin):
    """
    Mixin specifically for Survey model with surveyor field

    Usage:
        class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
            rbac_surveyor_field = 'surveyor'
            rbac_verifier_field = 'assigned_verifier'
            rbac_status_field = 'verification_status'
    """

    rbac_surveyor_field: str = 'surveyor'
    rbac_verifier_field: str = 'assigned_verifier'
    rbac_status_field: str = 'verification_status'
    rbac_verified_status: str = 'VERIFIED'
    rbac_submitted_status: str = 'SUBMITTED'

    def apply_rbac_filter(self, queryset, user):
        """Apply survey-specific filtering"""
        # Superusers and admins see all
        if self.rbac_allow_superuser and user.is_superuser:
            return queryset

        role = getattr(user, 'role', None)

        if self.rbac_admin_sees_all and role == 'ADMIN':
            return queryset

        if role == 'SURVEYOR':
            # Surveyors see their own surveys
            return queryset.filter(**{self.rbac_surveyor_field: user})

        elif role == 'VERIFIER':
            # Verifiers see assigned surveys + submitted surveys
            return queryset.filter(
                Q(**{self.rbac_verifier_field: user}) |
                Q(**{self.rbac_status_field: self.rbac_submitted_status})
            )

        elif role == 'VIEWER':
            # Viewers see only verified surveys
            return queryset.filter(**{self.rbac_status_field: self.rbac_verified_status})

        else:
            # Unknown role - no access
            return queryset.none()


class UserActivityFilterMixin(RBACQuerySetMixin):
    """
    Mixin for models with user field (activity logs, audit logs)

    Usage:
        class ActivityLogViewSet(UserActivityFilterMixin, viewsets.ReadOnlyModelViewSet):
            rbac_user_field = 'user'
            rbac_admin_sees_all = True
            rbac_verifier_sees_all = False
    """

    rbac_user_field: str = 'user'
    rbac_verifier_sees_all: bool = False
    rbac_viewer_sees_own: bool = True

    def apply_rbac_filter(self, queryset, user):
        """Apply user-activity-based filtering"""
        # Superusers see all
        if self.rbac_allow_superuser and user.is_superuser:
            return queryset

        role = getattr(user, 'role', None)

        # Admin sees all
        if self.rbac_admin_sees_all and role == 'ADMIN':
            return queryset

        # Verifier sees all (if configured)
        if self.rbac_verifier_sees_all and role == 'VERIFIER':
            return queryset

        # Everyone else sees only their own activity
        if self.rbac_viewer_sees_own:
            return queryset.filter(**{self.rbac_user_field: user})

        return queryset.none()


class StatusBasedFilterMixin(RBACQuerySetMixin):
    """
    Mixin for models with status/active fields

    Usage:
        class ServiceViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
            rbac_status_field = 'is_active'
            rbac_status_value = True
            rbac_admin_sees_inactive = True
    """

    rbac_status_field: str = 'is_active'
    rbac_status_value: Any = True
    rbac_admin_sees_inactive: bool = True
    rbac_verifier_sees_inactive: bool = False

    def apply_rbac_filter(self, queryset, user):
        """Apply status-based filtering"""
        # Superusers see all
        if self.rbac_allow_superuser and user.is_superuser:
            return queryset

        role = getattr(user, 'role', None)

        # Admin sees all (including inactive)
        if self.rbac_admin_sees_inactive and role == 'ADMIN':
            return queryset

        # Verifier sees all (if configured)
        if self.rbac_verifier_sees_inactive and role == 'VERIFIER':
            return queryset

        # Everyone else sees only active/verified items
        return queryset.filter(**{self.rbac_status_field: self.rbac_status_value})


class CombinedRBACMixin(RBACQuerySetMixin):
    """
    Mixin that combines multiple RBAC strategies

    Usage:
        class ServiceViewSet(CombinedRBACMixin, viewsets.ModelViewSet):
            rbac_strategies = [
                ('ownership', {'owner_field': 'created_by'}),
                ('status', {'status_field': 'is_active', 'status_value': True}),
            ]
    """

    rbac_strategies: list = []

    def apply_rbac_filter(self, queryset, user):
        """Apply multiple RBAC strategies"""
        # Superusers see all
        if self.rbac_allow_superuser and user.is_superuser:
            return queryset

        role = getattr(user, 'role', None)

        # Admin sees all
        if self.rbac_admin_sees_all and role == 'ADMIN':
            return queryset

        # Apply each strategy
        for strategy_name, config in self.rbac_strategies:
            if strategy_name == 'ownership':
                owner_field = config.get('owner_field', 'created_by')
                queryset = queryset.filter(**{owner_field: user})
            elif strategy_name == 'status':
                status_field = config.get('status_field', 'is_active')
                status_value = config.get('status_value', True)
                queryset = queryset.filter(**{status_field: status_value})

        return queryset


# Utility Functions

def rbac_queryset_filter(role_filters: Dict[str, Optional[Q]], admin_sees_all: bool = True):
    """
    Decorator to add RBAC filtering to get_queryset method

    Usage:
        @rbac_queryset_filter({
            'ADMIN': None,
            'SURVEYOR': Q(surveyor=F('request_user')),
            'VIEWER': Q(is_active=True),
        })
        def get_queryset(self):
            return super().get_queryset()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            queryset = func(self, *args, **kwargs)

            if not hasattr(self, 'request') or not self.request.user.is_authenticated:
                return queryset

            user = self.request.user

            # Superusers see all
            if user.is_superuser:
                return queryset

            role = getattr(user, 'role', None)

            # Admin sees all
            if admin_sees_all and role == 'ADMIN':
                return queryset

            # Apply role-based filter
            if role in role_filters:
                filter_q = role_filters[role]
                if filter_q is not None:
                    # Replace user placeholder
                    if hasattr(filter_q, 'children'):
                        new_children = []
                        for child in filter_q.children:
                            if isinstance(child, tuple):
                                key, value = child
                                if value == '__request_user__':
                                    new_children.append((key, user))
                                else:
                                    new_children.append(child)
                            else:
                                new_children.append(child)
                        filter_q.children = new_children
                    queryset = queryset.filter(filter_q)

            return queryset

        return wrapper
    return decorator


def get_rbac_filter_q(user, model_type: str = 'default') -> Optional[Q]:
    """
    Helper function to get RBAC filter Q object for a user

    Args:
        user: User instance
        model_type: Type of model ('survey', 'service', 'log', etc.)

    Returns:
        Q object for filtering or None
    """
    if not user or not user.is_authenticated:
        return Q(pk__in=[])  # Empty queryset

    if user.is_superuser:
        return None  # No filter

    role = getattr(user, 'role', None)

    if model_type == 'survey':
        if role == 'ADMIN':
            return None
        elif role == 'SURVEYOR':
            return Q(surveyor=user)
        elif role == 'VERIFIER':
            return Q(assigned_verifier=user) | Q(verification_status='SUBMITTED')
        elif role == 'VIEWER':
            return Q(verification_status='VERIFIED')

    elif model_type == 'service':
        if role == 'ADMIN':
            return None
        else:
            return Q(is_active=True)

    elif model_type == 'log':
        if role == 'ADMIN':
            return None
        elif role == 'VERIFIER':
            return None  # Verifiers see all logs
        else:
            return Q(user=user)  # Others see only their own

    elif model_type == 'user':
        if role == 'ADMIN':
            return None
        else:
            return Q(is_active=True)

    # Default: user sees only active items
    return Q(is_active=True)
