from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from decimal import Decimal
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
