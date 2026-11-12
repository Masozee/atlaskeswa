from django.conf import settings
from rest_framework import serializers

from .models import Publication

BLOCK_TYPES = {
    'p': ['text'],
    'h2': ['text'],
    'quote': ['text', 'cite'],
    'list': ['items'],
    'image': ['src', 'alt'],
    'table': ['caption', 'rows'],
    'steps': ['caption', 'items'],
    'timeline': ['caption', 'items'],
    'callout': ['title', 'items'],
    'note': ['text'],
    'diagram': ['diagram', 'caption'],
}
DIAGRAMS = {'desde-adaptation', 'ommha-classification'}


def _media_prefix():
    prefix = settings.MEDIA_URL
    return prefix if prefix.startswith('/') else f'/{prefix}'


def resolve_asset(request, value):
    """Storage path -> absolute media URL; site paths and URLs pass through."""
    if not value or value.startswith(('/', 'http://', 'https://')):
        return value
    url = f'{_media_prefix()}{value}'
    return request.build_absolute_uri(url) if request else url


def unresolve_asset(value):
    """Inverse of `resolve_asset`: a media URL the client echoed back -> storage path."""
    if not value:
        return ''
    value = value.strip()
    prefix = _media_prefix()
    if value.startswith(('http://', 'https://')):
        # Absolute media URL: keep only what follows /media/.
        marker = value.find(prefix)
        if marker != -1:
            return value[marker + len(prefix):]
        return value
    if value.startswith(prefix):
        return value[len(prefix):]
    return value


def _map_body_assets(body, fn):
    return [
        {**block, 'src': fn(block.get('src'))} if block.get('type') == 'image' else block
        for block in body
    ]


class PublicationSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source='get_type_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Publication
        fields = [
            'id', 'slug', 'type', 'type_label', 'status', 'status_label', 'date',
            'title', 'excerpt', 'author', 'period',
            'cover_src', 'cover_alt', 'cover_credit',
            'file_href', 'file_label', 'file_size',
            'external_url', 'body',
            'created_by_name', 'updated_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def _name(self, user):
        if not user:
            return None
        return user.get_full_name() or user.email

    def get_created_by_name(self, obj):
        return self._name(obj.created_by)

    def get_updated_by_name(self, obj):
        return self._name(obj.updated_by)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['cover_src'] = resolve_asset(request, data['cover_src'])
        data['file_href'] = resolve_asset(request, data['file_href'])
        data['body'] = _map_body_assets(data['body'] or [], lambda v: resolve_asset(request, v))
        return data

    def validate_slug(self, value):
        if value in {'upload'}:
            raise serializers.ValidationError('Slug ini dicadangkan sistem.')
        return value

    def validate_cover_src(self, value):
        return unresolve_asset(value)

    def validate_file_href(self, value):
        return unresolve_asset(value)

    def validate_body(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Isi harus berupa daftar blok.')
        for index, block in enumerate(value, start=1):
            if not isinstance(block, dict) or block.get('type') not in BLOCK_TYPES:
                raise serializers.ValidationError(f'Blok #{index}: jenis blok tidak dikenal.')
            missing = [key for key in BLOCK_TYPES[block['type']] if key not in block]
            if missing:
                raise serializers.ValidationError(
                    f'Blok #{index} ({block["type"]}): kolom {", ".join(missing)} wajib diisi.'
                )
            if block['type'] == 'diagram' and block['diagram'] not in DIAGRAMS:
                raise serializers.ValidationError(f'Blok #{index}: diagram tidak dikenal.')
        return _map_body_assets(value, unresolve_asset)

    def validate(self, attrs):
        external = attrs.get('external_url', getattr(self.instance, 'external_url', ''))
        cover = attrs.get('cover_src', getattr(self.instance, 'cover_src', ''))
        status = attrs.get('status', getattr(self.instance, 'status', Publication.Status.DRAFT))
        if status == Publication.Status.PUBLISHED and not cover:
            raise serializers.ValidationError({'cover_src': 'Gambar sampul wajib diisi sebelum terbit.'})
        if external and 'body' in attrs and attrs['body']:
            # External pieces have no detail page; drop a body nobody would see.
            attrs['body'] = []
        return attrs


class PublicationListSerializer(PublicationSerializer):
    """List payload: everything but the body."""

    class Meta(PublicationSerializer.Meta):
        fields = [f for f in PublicationSerializer.Meta.fields if f != 'body']

    def to_representation(self, instance):
        data = serializers.ModelSerializer.to_representation(self, instance)
        request = self.context.get('request')
        data['cover_src'] = resolve_asset(request, data['cover_src'])
        data['file_href'] = resolve_asset(request, data['file_href'])
        return data
