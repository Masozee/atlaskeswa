from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdmin
from .models import SystemSettings
from .serializers import SystemSettingsSerializer


class SystemSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet for System Settings (Singleton)
    Only admins can modify settings, but anyone can view them
    """
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Only admins can update settings"""
        if self.action in ['update', 'partial_update']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def list(self, request):
        """Get current system settings"""
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Get system settings (always returns singleton)"""
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """Update system settings (full update)"""
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(
            settings,
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """Update system settings (partial update)"""
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(
            settings,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def public(self, request):
        """Get public settings (no auth required)"""
        settings = SystemSettings.load()
        # Only return public-safe settings
        return Response({
            'app_name': settings.app_name,
            'app_description': settings.app_description,
            'app_logo': settings.app_logo.url if settings.app_logo else None,
            'app_favicon': settings.app_favicon.url if settings.app_favicon else None,
            'maintenance_mode': settings.maintenance_mode,
            'maintenance_message': settings.maintenance_message,
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def reset_to_defaults(self, request):
        """Reset settings to default values"""
        settings = SystemSettings.load()

        # Delete and recreate to reset to defaults
        settings.delete()
        new_settings = SystemSettings.load()
        new_settings.updated_by = request.user
        new_settings.save()

        serializer = SystemSettingsSerializer(new_settings)
        return Response(serializer.data)
