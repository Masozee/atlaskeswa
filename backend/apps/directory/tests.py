import csv
import io
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.urls import reverse
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status
from .models import (
    MainTypeOfCare, BasicStableInputsOfCare, TargetPopulation,
    ServiceType, Service
)

User = get_user_model()


class MainTypeOfCareTests(TestCase):
    """Test cases for MainTypeOfCare model"""

    def test_create_mtc(self):
        """Test creating a main type of care"""
        mtc = MainTypeOfCare.objects.create(
            code='R1',
            name='Residential Care',
            description='24-hour residential mental health care'
        )

        self.assertEqual(mtc.code, 'R1')
        self.assertEqual(mtc.name, 'Residential Care')
        self.assertTrue(mtc.is_active)

    def test_mtc_str(self):
        """Test MTC string representation"""
        mtc = MainTypeOfCare.objects.create(
            code='R1',
            name='Residential Care'
        )

        self.assertEqual(str(mtc), 'R1 - Residential Care')

    def test_mtc_unique_code(self):
        """Test that MTC code must be unique"""
        MainTypeOfCare.objects.create(code='R1', name='Residential Care')

        with self.assertRaises(Exception):
            MainTypeOfCare.objects.create(code='R1', name='Duplicate Code')

    def test_mtc_parent_relationship(self):
        """Test hierarchical relationship with parent MTC"""
        parent = MainTypeOfCare.objects.create(code='R', name='Residential')
        child = MainTypeOfCare.objects.create(
            code='R1',
            name='Residential Type 1',
            parent=parent
        )

        self.assertEqual(child.parent, parent)
        self.assertIn(child, parent.children.all())


class BasicStableInputsOfCareTests(TestCase):
    """Test cases for BasicStableInputsOfCare model"""

    def test_create_bsic(self):
        """Test creating a basic stable inputs of care"""
        bsic = BasicStableInputsOfCare.objects.create(
            code='A',
            name='Accessibility',
            description='Service accessibility features'
        )

        self.assertEqual(bsic.code, 'A')
        self.assertEqual(bsic.name, 'Accessibility')
        self.assertTrue(bsic.is_active)

    def test_bsic_str(self):
        """Test BSIC string representation"""
        bsic = BasicStableInputsOfCare.objects.create(
            code='A',
            name='Accessibility'
        )

        self.assertEqual(str(bsic), 'A - Accessibility')

    def test_bsic_unique_code(self):
        """Test that BSIC code must be unique"""
        BasicStableInputsOfCare.objects.create(code='A', name='Accessibility')

        with self.assertRaises(Exception):
            BasicStableInputsOfCare.objects.create(code='A', name='Duplicate')


class TargetPopulationTests(TestCase):
    """Test cases for TargetPopulation model"""

    def test_create_target_population(self):
        """Test creating a target population"""
        target = TargetPopulation.objects.create(
            name='Adults with Depression',
            description='Adults aged 18+ with depression diagnosis'
        )

        self.assertEqual(target.name, 'Adults with Depression')
        self.assertTrue(target.is_active)

    def test_target_population_str(self):
        """Test target population string representation"""
        target = TargetPopulation.objects.create(name='Children with Anxiety')

        self.assertEqual(str(target), 'Children with Anxiety')

    def test_target_population_unique_name(self):
        """Test that target population name must be unique"""
        TargetPopulation.objects.create(name='Adults with Depression')

        with self.assertRaises(Exception):
            TargetPopulation.objects.create(name='Adults with Depression')


class ServiceTypeTests(TestCase):
    """Test cases for ServiceType model"""

    def test_create_service_type(self):
        """Test creating a service type"""
        service_type = ServiceType.objects.create(
            name='Outpatient Clinic',
            description='Ambulatory mental health services'
        )

        self.assertEqual(service_type.name, 'Outpatient Clinic')
        self.assertTrue(service_type.is_active)

    def test_service_type_str(self):
        """Test service type string representation"""
        service_type = ServiceType.objects.create(name='Day Hospital')

        self.assertEqual(str(service_type), 'Day Hospital')


class ServiceTests(TestCase):
    """Test cases for Service model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

        self.mtc = MainTypeOfCare.objects.create(
            code='R1',
            name='Residential Care'
        )

        self.bsic = BasicStableInputsOfCare.objects.create(
            code='A',
            name='Accessibility'
        )

        self.service_type = ServiceType.objects.create(
            name='Psychiatric Hospital'
        )

        self.target_population = TargetPopulation.objects.create(
            name='Adults with Schizophrenia'
        )

    def test_create_service(self):
        """Test creating a mental health service"""
        service = Service.objects.create(
            name='Jakarta Mental Health Center',
            description='Comprehensive mental health services',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            phone_number='+62211234567',
            email='info@jkmhc.id',
            website='https://jkmhc.id',
            address='Jl. Mental Health No. 123',
            city='Jakarta',
            province='DKI Jakarta',
            postal_code='12345',
            bed_capacity=100,
            staff_count=50,
            psychiatrist_count=5,
            psychologist_count=10,
            nurse_count=20,
            social_worker_count=8,
            created_by=self.user
        )

        self.assertEqual(service.name, 'Jakarta Mental Health Center')
        self.assertEqual(service.mtc, self.mtc)
        self.assertEqual(service.bsic, self.bsic)
        self.assertEqual(service.city, 'Jakarta')
        self.assertEqual(service.bed_capacity, 100)
        self.assertTrue(service.is_active)
        self.assertFalse(service.is_verified)

    def test_service_str(self):
        """Test service string representation"""
        service = Service.objects.create(
            name='Bandung Mental Health Clinic',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Bandung',
            province='West Java'
        )

        self.assertEqual(str(service), 'Bandung Mental Health Clinic (Bandung)')

    def test_service_total_professional_staff(self):
        """Test total professional staff calculation"""
        service = Service.objects.create(
            name='Test Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta',
            psychiatrist_count=5,
            psychologist_count=10,
            nurse_count=15,
            social_worker_count=7
        )

        self.assertEqual(service.total_professional_staff, 37)

    def test_service_with_coordinates(self):
        """Test service with latitude and longitude"""
        service = Service.objects.create(
            name='Test Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta',
            latitude=Decimal('-6.2088'),
            longitude=Decimal('106.8456')
        )

        self.assertEqual(service.latitude, Decimal('-6.2088'))
        self.assertEqual(service.longitude, Decimal('106.8456'))

    def test_service_target_populations(self):
        """Test many-to-many relationship with target populations"""
        target1 = TargetPopulation.objects.create(name='Adults with Depression')
        target2 = TargetPopulation.objects.create(name='Children with ADHD')

        service = Service.objects.create(
            name='Test Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta'
        )

        service.target_populations.add(target1, target2)

        self.assertEqual(service.target_populations.count(), 2)
        self.assertIn(target1, service.target_populations.all())
        self.assertIn(target2, service.target_populations.all())

    def test_service_insurance_flags(self):
        """Test insurance acceptance flags"""
        service = Service.objects.create(
            name='Test Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta',
            accepts_bpjs=True,
            accepts_private_insurance=True
        )

        self.assertTrue(service.accepts_bpjs)
        self.assertTrue(service.accepts_private_insurance)

    def test_service_emergency_flags(self):
        """Test emergency and 24/7 flags"""
        service = Service.objects.create(
            name='Emergency Mental Health Unit',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta',
            is_24_7=True,
            accepts_emergency=True
        )

        self.assertTrue(service.is_24_7)
        self.assertTrue(service.accepts_emergency)

    def test_service_verification(self):
        """Test service verification workflow"""
        verifier = User.objects.create_user(
            email='verifier@example.com',
            password='testpass123',
            role=User.Role.VERIFIER
        )

        service = Service.objects.create(
            name='Test Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta',
            created_by=self.user
        )

        # Initially not verified
        self.assertFalse(service.is_verified)
        self.assertIsNone(service.verified_by)
        self.assertIsNone(service.verified_at)

        # Verify the service
        from django.utils import timezone
        service.is_verified = True
        service.verified_by = verifier
        service.verified_at = timezone.now()
        service.save()

        self.assertTrue(service.is_verified)
        self.assertEqual(service.verified_by, verifier)
        self.assertIsNotNone(service.verified_at)

    def test_service_bed_capacity_validation(self):
        """Test bed capacity cannot be negative"""
        service = Service.objects.create(
            name='Test Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta',
            bed_capacity=50
        )

        # Attempting to set negative capacity
        service.bed_capacity = -10

        with self.assertRaises(ValidationError):
            service.full_clean()

    def test_service_timestamps(self):
        """Test that timestamps are automatically created"""
        service = Service.objects.create(
            name='Test Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta'
        )

        self.assertIsNotNone(service.created_at)
        self.assertIsNotNone(service.updated_at)

    def test_service_ordering(self):
        """Test that services are ordered by created_at descending"""
        service1 = Service.objects.create(
            name='First Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta'
        )

        service2 = Service.objects.create(
            name='Second Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Bandung',
            province='West Java'
        )

        services = Service.objects.all()
        self.assertEqual(services[0], service2)  # Most recent first
        self.assertEqual(services[1], service1)

    def test_service_created_by_set_null_on_delete(self):
        """Test that service persists when creator is deleted"""
        service = Service.objects.create(
            name='Test Service',
            mtc=self.mtc,
            bsic=self.bsic,
            service_type=self.service_type,
            city='Jakarta',
            province='DKI Jakarta',
            created_by=self.user
        )

        service_id = service.id
        self.user.delete()

        # Service should still exist
        service = Service.objects.get(id=service_id)
        self.assertIsNone(service.created_by)


# ---------------------------------------------------------------------------
# BSIC API endpoint tests
# ---------------------------------------------------------------------------

class BSICAPITests(TestCase):
    """API tests for BasicStableInputsOfCare CRUD, bulk-delete, bulk-update, export, import."""

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass', role='ADMIN',
            first_name='Admin', last_name='User'
        )
        self.surveyor = User.objects.create_user(
            email='surveyor@test.com', password='pass', role='SURVEYOR',
            first_name='Surveyor', last_name='User'
        )
        self.viewer = User.objects.create_user(
            email='viewer@test.com', password='pass', role='VIEWER',
            first_name='Viewer', last_name='User'
        )

        self.b1 = BasicStableInputsOfCare.objects.create(code='B1', name='Category One', description='Desc one', is_active=True)
        self.b2 = BasicStableInputsOfCare.objects.create(code='B2', name='Category Two', description='Desc two', is_active=True)
        self.b3 = BasicStableInputsOfCare.objects.create(code='B3', name='Category Three', description='Desc three', is_active=False)

    # ---- LIST ----

    def test_list_unauthenticated_returns_401(self):
        res = self.client.get('/v1/directory/bsic/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated_returns_all(self):
        self.client.force_authenticate(user=self.viewer)
        res = self.client.get('/v1/directory/bsic/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Response is paginated: {count, next, previous, results}
        self.assertEqual(res.data['count'], 3)

    # ---- CREATE ----

    def test_create_as_admin_succeeds(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/v1/directory/bsic/', {'code': 'B4', 'name': 'New Category', 'is_active': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['code'], 'B4')

    def test_create_as_non_admin_returns_403(self):
        self.client.force_authenticate(user=self.surveyor)
        res = self.client.post('/v1/directory/bsic/', {'code': 'B4', 'name': 'New Category'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ---- UPDATE ----

    def test_partial_update_as_admin_succeeds(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.patch(f'/v1/directory/bsic/{self.b1.id}/', {'name': 'Updated Name'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['name'], 'Updated Name')

    def test_partial_update_as_viewer_returns_403(self):
        self.client.force_authenticate(user=self.viewer)
        res = self.client.patch(f'/v1/directory/bsic/{self.b1.id}/', {'name': 'Hack'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ---- DELETE ----

    def test_delete_as_admin_succeeds(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.delete(f'/v1/directory/bsic/{self.b3.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(BasicStableInputsOfCare.objects.filter(id=self.b3.id).exists())

    def test_delete_as_surveyor_returns_403(self):
        self.client.force_authenticate(user=self.surveyor)
        res = self.client.delete(f'/v1/directory/bsic/{self.b1.id}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ---- BULK DELETE ----

    def test_bulk_delete_as_admin_succeeds(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/v1/directory/bsic/bulk-delete/', {'ids': [self.b1.id, self.b2.id]}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['deleted'], 2)
        self.assertFalse(BasicStableInputsOfCare.objects.filter(id__in=[self.b1.id, self.b2.id]).exists())

    def test_bulk_delete_empty_ids_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/v1/directory/bsic/bulk-delete/', {'ids': []}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_delete_invalid_payload_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/v1/directory/bsic/bulk-delete/', {'ids': 'not-a-list'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_delete_as_non_admin_returns_403(self):
        self.client.force_authenticate(user=self.viewer)
        res = self.client.post('/v1/directory/bsic/bulk-delete/', {'ids': [self.b1.id]}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # ---- BULK UPDATE ----

    def test_bulk_update_is_active_as_admin_succeeds(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            '/v1/directory/bsic/bulk-update/',
            {'ids': [self.b1.id, self.b2.id], 'updates': {'is_active': False}},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['updated'], 2)
        self.assertFalse(BasicStableInputsOfCare.objects.get(id=self.b1.id).is_active)
        self.assertFalse(BasicStableInputsOfCare.objects.get(id=self.b2.id).is_active)

    def test_bulk_update_disallowed_field_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            '/v1/directory/bsic/bulk-update/',
            {'ids': [self.b1.id], 'updates': {'code': 'HACKED'}},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_update_as_non_admin_returns_403(self):
        self.client.force_authenticate(user=self.surveyor)
        res = self.client.post(
            '/v1/directory/bsic/bulk-update/',
            {'ids': [self.b1.id], 'updates': {'is_active': False}},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_bulk_update_empty_ids_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            '/v1/directory/bsic/bulk-update/',
            {'ids': [], 'updates': {'is_active': False}},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- EXPORT ----

    def test_export_all_as_authenticated_returns_csv(self):
        self.client.force_authenticate(user=self.viewer)
        res = self.client.get('/v1/directory/bsic/export/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'text/csv')
        self.assertIn('attachment', res['Content-Disposition'])
        content = res.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        self.assertEqual(len(rows), 3)

    def test_export_selective_by_ids(self):
        self.client.force_authenticate(user=self.viewer)
        res = self.client.get(f'/v1/directory/bsic/export/?ids={self.b1.id},{self.b2.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        content = res.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        self.assertEqual(len(rows), 2)
        codes = {r['Code'] for r in rows}
        self.assertIn('B1', codes)
        self.assertIn('B2', codes)

    def test_export_unauthenticated_returns_401(self):
        res = self.client.get('/v1/directory/bsic/export/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_export_csv_headers(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/v1/directory/bsic/export/')
        content = res.content.decode('utf-8')
        first_line = content.split('\r\n')[0]
        self.assertIn('Code', first_line)
        self.assertIn('Name', first_line)
        self.assertIn('Status', first_line)

    # ---- IMPORT ----

    def _make_csv(self, rows):
        """Helper to build an in-memory CSV upload file."""
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(['code', 'name', 'description', 'is_active'])
        for r in rows:
            writer.writerow(r)
        buf.seek(0)
        return io.BytesIO(buf.read().encode('utf-8'))

    def test_import_as_admin_creates_records(self):
        self.client.force_authenticate(user=self.admin)
        csv_file = self._make_csv([
            ['B10', 'Imported One', 'desc', 'true'],
            ['B11', 'Imported Two', '', 'false'],
        ])
        res = self.client.post(
            '/v1/directory/bsic/import/',
            {'file': csv_file},
            format='multipart'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['created'], 2)
        self.assertEqual(res.data['errors'], [])
        self.assertTrue(BasicStableInputsOfCare.objects.filter(code='B10').exists())
        self.assertTrue(BasicStableInputsOfCare.objects.filter(code='B11').exists())

    def test_import_skips_duplicate_codes(self):
        self.client.force_authenticate(user=self.admin)
        csv_file = self._make_csv([
            ['B1', 'Duplicate', 'desc', 'true'],   # B1 already exists
            ['B99', 'Brand New', 'desc', 'true'],
        ])
        res = self.client.post(
            '/v1/directory/bsic/import/',
            {'file': csv_file},
            format='multipart'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['created'], 1)
        self.assertEqual(len(res.data['errors']), 1)

    def test_import_missing_required_field_reports_error(self):
        self.client.force_authenticate(user=self.admin)
        buf = io.BytesIO(b'code,description\nB20,no name here\n')
        res = self.client.post('/v1/directory/bsic/import/', {'file': buf}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['created'], 0)
        self.assertGreater(len(res.data['errors']), 0)

    def test_import_no_file_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/v1/directory/bsic/import/', {}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_import_as_non_admin_returns_403(self):
        self.client.force_authenticate(user=self.surveyor)
        csv_file = self._make_csv([['B99', 'Test', '', 'true']])
        res = self.client.post('/v1/directory/bsic/import/', {'file': csv_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_import_exported_format_roundtrip(self):
        """Exported CSV (capitalized headers + Status column) must reimport cleanly."""
        self.client.force_authenticate(user=self.admin)
        # Build a CSV in the exact format the export endpoint produces
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(['ID', 'Code', 'Name', 'Description', 'Status', 'Created At'])
        writer.writerow([99, 'B50', 'Roundtrip Cat', 'Some desc', 'Active', '2025-01-01 00:00'])
        writer.writerow([100, 'B51', 'Inactive Cat', '', 'Inactive', '2025-01-01 00:00'])
        buf.seek(0)
        csv_bytes = io.BytesIO(buf.read().encode('utf-8'))

        res = self.client.post('/v1/directory/bsic/import/', {'file': csv_bytes}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['created'], 2)
        self.assertEqual(res.data['errors'], [])
        b50 = BasicStableInputsOfCare.objects.get(code='B50')
        b51 = BasicStableInputsOfCare.objects.get(code='B51')
        self.assertTrue(b50.is_active)
        self.assertFalse(b51.is_active)
