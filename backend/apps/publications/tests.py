from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Publication

User = get_user_model()


def make_user(email, role):
    return User.objects.create_user(email=email, password='pw-12345678', role=role)


class PublicationAPITests(APITestCase):
    def setUp(self):
        self.admin = make_user('admin@example.com', 'ADMIN')
        self.viewer = make_user('viewer@example.com', 'VIEWER')
        self.published = Publication.objects.create(
            slug='terbit', type='LAPORAN', status='PUBLISHED', date='2026-01-02',
            title='Terbit', excerpt='x', author='Tim', cover_src='publikasi/uploads/a.jpg',
            body=[{'type': 'image', 'src': 'publikasi/uploads/b.jpg', 'alt': 'b', 'width': 1, 'height': 1}],
        )
        self.draft = Publication.objects.create(
            slug='draf', status='DRAFT', date='2026-01-03', title='Draf', excerpt='x', author='Tim',
        )

    def test_anonymous_sees_published_only(self):
        res = self.client.get('/v1/publications/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual([p['slug'] for p in res.data], ['terbit'])
        self.assertEqual(self.client.get('/v1/publications/draf/').status_code, 404)

    def test_media_paths_resolve_to_absolute_urls(self):
        res = self.client.get('/v1/publications/terbit/')
        self.assertEqual(res.data['cover_src'], 'http://testserver/media/publikasi/uploads/a.jpg')
        self.assertEqual(res.data['body'][0]['src'], 'http://testserver/media/publikasi/uploads/b.jpg')

    def test_echoed_urls_store_as_paths(self):
        self.client.force_authenticate(self.admin)
        detail = self.client.get('/v1/publications/terbit/').data
        res = self.client.patch('/v1/publications/terbit/', {
            'cover_src': detail['cover_src'], 'body': detail['body'],
        }, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.published.refresh_from_db()
        self.assertEqual(self.published.cover_src, 'publikasi/uploads/a.jpg')
        self.assertEqual(self.published.body[0]['src'], 'publikasi/uploads/b.jpg')

    def test_admin_sees_drafts_and_can_create(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(len(self.client.get('/v1/publications/').data), 2)
        res = self.client.post('/v1/publications/', {
            'slug': 'baru', 'type': 'ARTIKEL', 'date': '2026-02-01', 'title': 'Baru',
            'excerpt': 'x', 'author': 'Tim', 'body': [{'type': 'p', 'text': 'Halo'}],
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(Publication.objects.get(slug='baru').created_by, self.admin)

    def test_non_admin_cannot_write(self):
        self.client.force_authenticate(self.viewer)
        res = self.client.patch('/v1/publications/terbit/', {'title': 'Hack'}, format='json')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(self.client.get('/v1/publications/draf/').status_code, 404)

    def test_invalid_block_rejected(self):
        self.client.force_authenticate(self.admin)
        res = self.client.patch('/v1/publications/terbit/', {'body': [{'type': 'quote', 'text': 'x'}]}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_publishing_requires_cover(self):
        self.client.force_authenticate(self.admin)
        res = self.client.patch('/v1/publications/draf/', {'status': 'PUBLISHED'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('cover_src', res.data)

    def test_upload(self):
        self.client.force_authenticate(self.admin)
        import tempfile
        with tempfile.TemporaryDirectory() as tmp, override_settings(MEDIA_ROOT=tmp):
            res = self.client.post('/v1/publications/upload/', {
                'file': SimpleUploadedFile('Foto Kegiatan.jpg', b'x' * 2048, content_type='image/jpeg'),
            }, format='multipart')
            self.assertEqual(res.status_code, 201, res.data)
            self.assertTrue(res.data['path'].startswith('publikasi/uploads/foto-kegiatan-'))
            self.assertEqual(res.data['size'], '2 KB')
            bad = self.client.post('/v1/publications/upload/', {
                'file': SimpleUploadedFile('x.exe', b'x'),
            }, format='multipart')
            self.assertEqual(bad.status_code, 400)

    def test_upload_forbidden_for_viewer(self):
        self.client.force_authenticate(self.viewer)
        res = self.client.post('/v1/publications/upload/', {
            'file': SimpleUploadedFile('a.jpg', b'x'),
        }, format='multipart')
        self.assertEqual(res.status_code, 403)
