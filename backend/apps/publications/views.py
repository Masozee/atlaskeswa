import os
import uuid

from django.core.files.storage import default_storage
from django.utils.text import slugify
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Publication
from .serializers import PublicationListSerializer, PublicationSerializer, resolve_asset

ALLOWED_UPLOADS = {
    '.jpg', '.jpeg', '.png', '.webp', '.gif',  # images
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',  # documents
}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024


def is_admin(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user.role == 'ADMIN'))


class IsAdminOrReadOnly(permissions.BasePermission):
    """Anyone may read (published only, see queryset); only admins write."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_admin(request.user)


def human_size(num_bytes):
    if num_bytes < 1024 * 1024:
        return f'{max(1, round(num_bytes / 1024))} KB'
    return f'{num_bytes / (1024 * 1024):.1f} MB'.replace('.', ',')


class PublicationViewSet(viewsets.ModelViewSet):
    """
    Publications (press releases, reports, articles).

    - Anonymous and non-admin users: published publications only, read-only.
    - Admin: every publication including drafts, full CRUD, file uploads.
    """

    serializer_class = PublicationSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'excerpt', 'author', 'slug']
    ordering_fields = ['date', 'title', 'updated_at']
    ordering = ['-date', '-created_at']
    pagination_class = None  # A handful of rows; the public list wants them all.

    def get_queryset(self):
        queryset = Publication.objects.select_related('created_by', 'updated_by')
        if not is_admin(self.request.user):
            return queryset.filter(status=Publication.Status.PUBLISHED)
        params = self.request.query_params
        if params.get('status'):
            queryset = queryset.filter(status=params['status'])
        if params.get('type'):
            queryset = queryset.filter(type=params['type'])
        return queryset

    def get_serializer_class(self):
        if self.action == 'list' and self.request.query_params.get('full') != '1':
            return PublicationListSerializer
        return PublicationSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='upload',
            parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Store an image or document; returns its storage path, URL and size."""
        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'Berkas tidak ditemukan.'}, status=status.HTTP_400_BAD_REQUEST)
        stem, ext = os.path.splitext(upload.name)
        ext = ext.lower()
        if ext not in ALLOWED_UPLOADS:
            return Response({'detail': f'Jenis berkas {ext or "?"} tidak didukung.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if upload.size > MAX_UPLOAD_BYTES:
            return Response({'detail': 'Ukuran berkas maksimal 20 MB.'},
                            status=status.HTTP_400_BAD_REQUEST)
        name = f'{slugify(stem)[:80] or "berkas"}-{uuid.uuid4().hex[:8]}{ext}'
        path = default_storage.save(f'publikasi/uploads/{name}', upload)
        return Response({
            'path': path,
            'url': resolve_asset(request, path),
            'size': human_size(upload.size),
            'name': upload.name,
        }, status=status.HTTP_201_CREATED)
