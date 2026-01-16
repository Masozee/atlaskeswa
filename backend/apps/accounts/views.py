from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import UserActivityLog
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, UserActivityLogSerializer
)
from .permissions import IsAdmin, IsSurveyorOrAdmin, CanAccessUserData
from .mixins import StatusBasedFilterMixin

User = get_user_model()


class UserViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for User model with role-based access control
    Uses StatusBasedFilterMixin for RBAC filtering
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    # RBAC Mixin Configuration
    rbac_status_field = 'is_active'
    rbac_status_value = True
    rbac_admin_sees_inactive = True
    rbac_verifier_sees_inactive = False

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = {
        'role': ['exact'],
        'is_active': ['exact'],
    }

    search_fields = ['email', 'first_name', 'last_name', 'username', 'organization']
    ordering_fields = ['created_at', 'email', 'role']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        elif self.action == 'retrieve':
            # Can retrieve if admin or accessing own data
            return [IsAuthenticated(), CanAccessUserData()]
        return [IsAuthenticated()]

    # get_queryset is now handled by StatusBasedFilterMixin
    # The mixin automatically filters based on role:
    # - ADMIN: sees all users (including inactive)
    # - VERIFIER/SURVEYOR/VIEWER: see only active users

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def profile(self, request):
        """Update current user profile"""
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change current user password"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        # Check old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({'detail': 'Password changed successfully'})

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        """Get user statistics (admin only)"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()

        # Users by role
        role_stats = User.objects.values('role').annotate(count=Count('id'))

        # Recent registrations (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_registrations = User.objects.filter(
            created_at__gte=thirty_days_ago
        ).count()

        # Active users (logged in within last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recently_active = UserActivityLog.objects.filter(
            action='LOGIN',
            timestamp__gte=seven_days_ago
        ).values('user').distinct().count()

        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'role_distribution': list(role_stats),
            'recent_registrations': recent_registrations,
            'recently_active_users': recently_active
        })


class UserActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for User Activity Log (read-only)
    """
    queryset = UserActivityLog.objects.select_related('user').all()
    serializer_class = UserActivityLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    filterset_fields = {
        'user': ['exact'],
        'action': ['exact'],
        'timestamp': ['gte', 'lte'],
    }

    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'description', 'ip_address']
    ordering_fields = ['timestamp', 'action']
    ordering = ['-timestamp']

    def get_queryset(self):
        """Filter activity logs based on role permissions"""
        user = self.request.user

        if user.role == 'ADMIN':
            return self.queryset
        else:
            # Non-admins can only see their own activity logs
            return self.queryset.filter(user=user)

from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from apps.logs.models import ActivityLog

class CustomTokenObtainPairView(BaseTokenObtainPairView):
    """
    Custom login view that logs authentication attempts
    """
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '')
        
        try:
            response = super().post(request, *args, **kwargs)
            
            # Successful login
            if response.status_code == 200:
                # Get user by email
                try:
                    user = User.objects.get(email=email)
                    ActivityLog.objects.create(
                        user=user,
                        username=user.email,
                        action=ActivityLog.Action.LOGIN,
                        severity=ActivityLog.Severity.INFO,
                        description=f'User logged in successfully',
                        ip_address=self.get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        request_method='POST',
                        request_path='/api/accounts/auth/login/',
                    )
                except User.DoesNotExist:
                    pass
            
            return response
            
        except Exception as e:
            # Failed login attempt
            ActivityLog.objects.create(
                user=None,
                username=email,
                action=ActivityLog.Action.LOGIN_FAILED,
                severity=ActivityLog.Severity.WARNING,
                description=f'Failed login attempt for {email}',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                request_method='POST',
                request_path='/api/accounts/auth/login/',
            )
            raise
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
