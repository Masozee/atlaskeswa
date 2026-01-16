"""
RBAC Filter Utilities
Helper functions and classes for role-based queryset filtering
"""

from django.db.models import Q, Model, QuerySet
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass
from enum import Enum


class RBACOperator(Enum):
    """Operators for combining RBAC rules"""
    AND = 'AND'
    OR = 'OR'
    NOT = 'NOT'


@dataclass
class RBACRule:
    """
    Represents a single RBAC filtering rule

    Examples:
        RBACRule.all()  # No filtering
        RBACRule.none()  # No access
        RBACRule.owned_by('created_by')  # Owner-based
        RBACRule.status_equals('is_active', True)  # Status-based
        RBACRule.field_equals('assigned_verifier', user)  # Field match
    """
    filter_type: str
    field_name: Optional[str] = None
    field_value: Any = None
    q_object: Optional[Q] = None

    @classmethod
    def all(cls):
        """Allow access to all objects"""
        return cls(filter_type='all')

    @classmethod
    def none(cls):
        """Deny access to all objects"""
        return cls(filter_type='none')

    @classmethod
    def owned_by(cls, field_name: str = 'created_by'):
        """Filter by ownership field"""
        return cls(filter_type='owned_by', field_name=field_name)

    @classmethod
    def field_equals(cls, field_name: str, value: Any):
        """Filter where field equals value"""
        return cls(filter_type='field_equals', field_name=field_name, field_value=value)

    @classmethod
    def status_equals(cls, status: str, field_name: str = 'status'):
        """Filter by status field"""
        return cls(filter_type='status', field_name=field_name, field_value=status)

    @classmethod
    def assigned_to(cls, field_name: str = 'assigned_to'):
        """Filter by assignment field"""
        return cls(filter_type='assigned_to', field_name=field_name)

    @classmethod
    def custom(cls, q_object: Q):
        """Custom Q object filter"""
        return cls(filter_type='custom', q_object=q_object)

    @classmethod
    def any(cls, rules: List['RBACRule']):
        """Combine rules with OR operator"""
        q = Q()
        for rule in rules:
            q |= rule.to_q()
        return cls(filter_type='custom', q_object=q)

    @classmethod
    def all_of(cls, rules: List['RBACRule']):
        """Combine rules with AND operator"""
        q = Q()
        for rule in rules:
            q &= rule.to_q()
        return cls(filter_type='custom', q_object=q)

    def to_q(self, user=None) -> Optional[Q]:
        """Convert rule to Q object"""
        if self.filter_type == 'all':
            return None

        if self.filter_type == 'none':
            return Q(pk__in=[])

        if self.filter_type == 'owned_by':
            if user is None:
                raise ValueError("User required for owned_by filter")
            return Q(**{self.field_name: user})

        if self.filter_type == 'field_equals':
            return Q(**{self.field_name: self.field_value})

        if self.filter_type == 'status':
            return Q(**{self.field_name: self.field_value})

        if self.filter_type == 'assigned_to':
            if user is None:
                raise ValueError("User required for assigned_to filter")
            return Q(**{self.field_name: user})

        if self.filter_type == 'custom':
            return self.q_object

        return None


@dataclass
class RBACConfig:
    """
    Configuration for RBAC filtering per role

    Usage:
        config = RBACConfig(
            admin=RBACRule.all(),
            surveyor=RBACRule.owned_by('surveyor'),
            verifier=RBACRule.any([
                RBACRule.assigned_to('assigned_verifier'),
                RBACRule.status_equals('SUBMITTED', 'verification_status')
            ]),
            viewer=RBACRule.status_equals('VERIFIED', 'verification_status')
        )
    """
    admin: Optional[RBACRule] = None
    surveyor: Optional[RBACRule] = None
    verifier: Optional[RBACRule] = None
    viewer: Optional[RBACRule] = None
    default: Optional[RBACRule] = None

    def get_rule_for_role(self, role: str) -> Optional[RBACRule]:
        """Get rule for specific role"""
        role_map = {
            'ADMIN': self.admin,
            'SURVEYOR': self.surveyor,
            'VERIFIER': self.verifier,
            'VIEWER': self.viewer,
        }
        return role_map.get(role, self.default)

    def to_dict(self) -> Dict[str, Optional[RBACRule]]:
        """Convert to dictionary"""
        return {
            'ADMIN': self.admin,
            'SURVEYOR': self.surveyor,
            'VERIFIER': self.verifier,
            'VIEWER': self.viewer,
        }


class RBACFilterBuilder:
    """
    Builder class for constructing complex RBAC filters

    Usage:
        builder = RBACFilterBuilder()
        builder.for_role('ADMIN').allow_all()
        builder.for_role('SURVEYOR').filter_by_ownership('surveyor')
        builder.for_role('VIEWER').filter_by_status('VERIFIED', 'verification_status')
        config = builder.build()
    """

    def __init__(self):
        self.rules: Dict[str, RBACRule] = {}
        self.current_role: Optional[str] = None

    def for_role(self, role: str) -> 'RBACFilterBuilder':
        """Set current role for configuration"""
        self.current_role = role
        return self

    def allow_all(self) -> 'RBACFilterBuilder':
        """Allow access to all objects for current role"""
        if self.current_role:
            self.rules[self.current_role] = RBACRule.all()
        return self

    def deny_all(self) -> 'RBACFilterBuilder':
        """Deny access to all objects for current role"""
        if self.current_role:
            self.rules[self.current_role] = RBACRule.none()
        return self

    def filter_by_ownership(self, field_name: str = 'created_by') -> 'RBACFilterBuilder':
        """Filter by ownership field for current role"""
        if self.current_role:
            self.rules[self.current_role] = RBACRule.owned_by(field_name)
        return self

    def filter_by_status(self, status: str, field_name: str = 'status') -> 'RBACFilterBuilder':
        """Filter by status field for current role"""
        if self.current_role:
            self.rules[self.current_role] = RBACRule.status_equals(status, field_name)
        return self

    def filter_by_assignment(self, field_name: str = 'assigned_to') -> 'RBACFilterBuilder':
        """Filter by assignment field for current role"""
        if self.current_role:
            self.rules[self.current_role] = RBACRule.assigned_to(field_name)
        return self

    def filter_by_custom(self, q_object: Q) -> 'RBACFilterBuilder':
        """Add custom Q object filter for current role"""
        if self.current_role:
            self.rules[self.current_role] = RBACRule.custom(q_object)
        return self

    def combine_any(self, *rules: RBACRule) -> 'RBACFilterBuilder':
        """Combine multiple rules with OR for current role"""
        if self.current_role:
            self.rules[self.current_role] = RBACRule.any(list(rules))
        return self

    def combine_all(self, *rules: RBACRule) -> 'RBACFilterBuilder':
        """Combine multiple rules with AND for current role"""
        if self.current_role:
            self.rules[self.current_role] = RBACRule.all_of(list(rules))
        return self

    def build(self) -> Dict[str, RBACRule]:
        """Build the RBAC configuration"""
        return self.rules


def apply_rbac_to_queryset(
    queryset: QuerySet,
    user,
    role_rules: Union[Dict[str, RBACRule], RBACConfig],
    admin_sees_all: bool = True,
    allow_superuser: bool = True
) -> QuerySet:
    """
    Apply RBAC filtering to a queryset

    Args:
        queryset: QuerySet to filter
        user: User object with role attribute
        role_rules: Dictionary or RBACConfig mapping roles to rules
        admin_sees_all: Whether admins see all objects
        allow_superuser: Whether superusers bypass all filters

    Returns:
        Filtered QuerySet
    """
    if not user or not user.is_authenticated:
        return queryset.none()

    # Superusers see all
    if allow_superuser and user.is_superuser:
        return queryset

    role = getattr(user, 'role', None)
    if not role:
        return queryset.none()

    # Admin sees all
    if admin_sees_all and role == 'ADMIN':
        return queryset

    # Get rule for role
    if isinstance(role_rules, RBACConfig):
        rule = role_rules.get_rule_for_role(role)
    else:
        rule = role_rules.get(role)

    if rule is None:
        return queryset.none()

    # Convert rule to Q object
    q_filter = rule.to_q(user=user)

    if q_filter is None:
        # No filter means see all
        return queryset

    return queryset.filter(q_filter)


def get_accessible_ids(
    model: Model,
    user,
    role_rules: Union[Dict[str, RBACRule], RBACConfig],
    id_field: str = 'id'
) -> List[Any]:
    """
    Get list of object IDs that user can access

    Args:
        model: Django model class
        user: User object
        role_rules: RBAC rules configuration
        id_field: Name of ID field

    Returns:
        List of accessible object IDs
    """
    queryset = model.objects.all()
    filtered = apply_rbac_to_queryset(queryset, user, role_rules)
    return list(filtered.values_list(id_field, flat=True))


def user_can_access_object(
    obj: Model,
    user,
    role_rules: Union[Dict[str, RBACRule], RBACConfig]
) -> bool:
    """
    Check if user can access a specific object

    Args:
        obj: Model instance to check
        user: User object
        role_rules: RBAC rules configuration

    Returns:
        True if user can access object, False otherwise
    """
    model_class = type(obj)
    accessible_ids = get_accessible_ids(model_class, user, role_rules)
    return obj.pk in accessible_ids


def create_ownership_filter(user, owner_field: str = 'created_by') -> Q:
    """Create Q filter for ownership"""
    return Q(**{owner_field: user})


def create_status_filter(status: str, status_field: str = 'status') -> Q:
    """Create Q filter for status"""
    return Q(**{status_field: status})


def create_assignment_filter(user, assignment_field: str = 'assigned_to') -> Q:
    """Create Q filter for assignment"""
    return Q(**{assignment_field: user})


def create_active_filter(is_active: bool = True, active_field: str = 'is_active') -> Q:
    """Create Q filter for active status"""
    return Q(**{active_field: is_active})
