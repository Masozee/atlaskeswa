from rest_framework import permissions
from django.core.exceptions import ObjectDoesNotExist


class IsAdmin(permissions.BasePermission):
    """Permission for admin users only"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


class IsSurveyor(permissions.BasePermission):
    """Permission for surveyor users"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'SURVEYOR'


class IsVerifier(permissions.BasePermission):
    """Permission for verifier users"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'VERIFIER'


class IsViewer(permissions.BasePermission):
    """Permission for viewer users"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'VIEWER'


class IsSurveyorOrAdmin(permissions.BasePermission):
    """Permission for surveyors and admins"""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['SURVEYOR', 'ADMIN']
        )


class IsVerifierOrAdmin(permissions.BasePermission):
    """Permission for verifiers and admins"""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['VERIFIER', 'ADMIN']
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has a `created_by` attribute.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner or admin
        if request.user.role == 'ADMIN':
            return True

        return hasattr(obj, 'created_by') and obj.created_by == request.user


class IsSurveyOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission for surveys.
    Surveyor can edit own surveys, verifier can verify, admin can do anything.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admin can do anything
        if request.user.role == 'ADMIN':
            return True

        # Surveyor can edit own surveys
        if request.user.role == 'SURVEYOR':
            return obj.surveyor == request.user

        # Verifier can verify assigned surveys
        if request.user.role == 'VERIFIER':
            return obj.assigned_verifier == request.user

        return False


class CanAccessUserData(permissions.BasePermission):
    """
    Permission to check if user can access another user's data
    """

    def has_object_permission(self, request, view, obj):
        # User can access their own data
        if obj == request.user:
            return True

        # Admin can access all user data
        if request.user.role == 'ADMIN':
            return True

        # Verifier can view surveyor data for assigned surveys
        if request.user.role == 'VERIFIER' and obj.role == 'SURVEYOR':
            # Check if verifier has any surveys assigned from this surveyor
            from apps.survey.models import Survey
            has_assigned_surveys = Survey.objects.filter(
                surveyor=obj,
                assigned_verifier=request.user
            ).exists()
            return has_assigned_surveys if request.method in permissions.SAFE_METHODS else False

        return False


class CanAccessServiceData(permissions.BasePermission):
    """
    Permission to check if user can access/modify service data
    """

    def has_object_permission(self, request, view, obj):
        # All authenticated users can read
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admin can do anything
        if request.user.role == 'ADMIN':
            return True

        # Surveyor can edit services they created
        if request.user.role == 'SURVEYOR':
            return obj.created_by == request.user

        # Verifier can only read, not modify
        return False


class CanAccessAuditLog(permissions.BasePermission):
    """
    Permission to check if user can access audit logs
    """

    def has_permission(self, request, view):
        # Only admin and verifier can access audit logs
        return request.user.role in ['ADMIN', 'VERIFIER']

    def has_object_permission(self, request, view, obj):
        # Admin can access all logs
        if request.user.role == 'ADMIN':
            return True

        # Verifier can only view logs related to their verification activities
        if request.user.role == 'VERIFIER':
            # Check if the log is related to the verifier's assigned surveys
            if hasattr(obj, 'survey'):
                return obj.survey.assigned_verifier == request.user
            # Allow read-only access to general logs
            return request.method in permissions.SAFE_METHODS

        return False


class CanModifySurveyStatus(permissions.BasePermission):
    """
    Permission to check if user can change survey verification status
    """

    def has_object_permission(self, request, view, obj):
        from apps.survey.models import Survey

        # Admin can modify any status
        if request.user.role == 'ADMIN':
            return True

        # Surveyor can only submit their own draft surveys
        if request.user.role == 'SURVEYOR':
            if view.action == 'submit':
                return (
                    obj.surveyor == request.user and
                    obj.verification_status == Survey.Status.DRAFT
                )
            return False

        # Verifier can verify/reject assigned surveys
        if request.user.role == 'VERIFIER':
            if view.action == 'verify':
                return (
                    obj.assigned_verifier == request.user and
                    obj.verification_status == Survey.Status.SUBMITTED
                )
            return False

        return False
