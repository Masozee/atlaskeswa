from django.conf import settings
from django.db import models


class Publication(models.Model):
    """
    A public OMMHA publication: press release, research report or article.

    The body is a list of typed content blocks (paragraph, heading, quote,
    image, table, ...) rendered by the frontend's `BlockView`. Asset fields
    (`cover_src`, `file_href`, image block `src`) hold either a site path
    served by the frontend (`/publikasi/x.jpg`), an absolute URL, or a storage
    path of an upload (`publikasi/uploads/x.jpg`); the serializer resolves the
    latter to an absolute media URL.
    """

    class Type(models.TextChoices):
        SIARAN_PERS = 'SIARAN_PERS', 'Siaran pers'
        LAPORAN = 'LAPORAN', 'Laporan'
        ARTIKEL = 'ARTIKEL', 'Artikel'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draf'
        PUBLISHED = 'PUBLISHED', 'Terbit'

    slug = models.SlugField(max_length=255, unique=True)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.ARTIKEL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    date = models.DateField(help_text='Tanggal publikasi')
    title = models.CharField(max_length=500)
    excerpt = models.TextField()
    author = models.CharField(max_length=255)
    period = models.CharField(max_length=255, blank=True, help_text='Periode penelitian (laporan)')

    cover_src = models.CharField(max_length=500, blank=True)
    cover_alt = models.CharField(max_length=500, blank=True)
    cover_credit = models.CharField(max_length=500, blank=True)

    file_href = models.CharField(max_length=500, blank=True, help_text='Berkas unduhan (PDF)')
    file_label = models.CharField(max_length=255, blank=True)
    file_size = models.CharField(max_length=50, blank=True)

    external_url = models.URLField(
        max_length=500, blank=True,
        help_text='Jika diisi, kartu langsung menautkan ke URL ini dan tidak ada halaman detail.',
    )
    body = models.JSONField(default=list, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='publications_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='publications_updated',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [models.Index(fields=['status', '-date'])]

    def __str__(self):
        return self.title
