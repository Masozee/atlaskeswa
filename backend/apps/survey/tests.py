from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
from apps.directory.models import MainTypeOfCare, BasicStableInputsOfCare, ServiceType, Service
from .models import Survey, SurveyAttachment, SurveyAuditLog

User = get_user_model()


class SurveyModelTests(TestCase):
    """Test cases for Survey model"""

    def setUp(self):
        """Set up test data"""
        self.surveyor = User.objects.create_user(
            email='surveyor@example.com',
            password='testpass123',
            role=User.Role.SURVEYOR
        )
        
        self.verifier = User.objects.create_user(
            email='verifier@example.com',
            password='testpass123',
            role=User.Role.VERIFIER
        )
        
        mtc = MainTypeOfCare.objects.create(code='R1', name='Residential')
        bsic = BasicStableInputsOfCare.objects.create(code='A', name='Accessibility')
        service_type = ServiceType.objects.create(name='Hospital')
        
        self.service = Service.objects.create(
            name='Test Service',
            mtc=mtc,
            bsic=bsic,
            service_type=service_type,
            city='Jakarta',
            province='DKI Jakarta'
        )

    def test_create_survey(self):
        """Test creating a survey"""
        survey = Survey.objects.create(
            service=self.service,
            survey_date=date.today(),
            survey_period_start=date.today() - timedelta(days=30),
            survey_period_end=date.today(),
            surveyor=self.surveyor,
            current_bed_capacity=50,
            beds_occupied=30,
            total_patients_served=100
        )
        
        self.assertEqual(survey.service, self.service)
        self.assertEqual(survey.surveyor, self.surveyor)
        self.assertEqual(survey.verification_status, Survey.Status.DRAFT)
        
    def test_survey_occupancy_rate(self):
        """Test occupancy rate calculation"""
        survey = Survey.objects.create(
            service=self.service,
            survey_date=date.today(),
            survey_period_start=date.today(),
            survey_period_end=date.today(),
            surveyor=self.surveyor,
            current_bed_capacity=100,
            beds_occupied=75
        )
        
        self.assertEqual(survey.occupancy_rate, 75.0)


class SurveyWorkflowTests(TestCase):
    """Test survey verification workflow"""

    def setUp(self):
        """Set up test data"""
        self.surveyor = User.objects.create_user(email='surveyor@example.com', password='pass', role=User.Role.SURVEYOR)
        self.verifier = User.objects.create_user(email='verifier@example.com', password='pass', role=User.Role.VERIFIER)
        
        mtc = MainTypeOfCare.objects.create(code='R1', name='Residential')
        bsic = BasicStableInputsOfCare.objects.create(code='A', name='Accessibility')
        service_type = ServiceType.objects.create(name='Hospital')
        
        self.service = Service.objects.create(
            name='Test Service',
            mtc=mtc,
            bsic=bsic,
            service_type=service_type,
            city='Jakarta',
            province='DKI Jakarta'
        )

    def test_survey_status_workflow(self):
        """Test survey status transitions"""
        survey = Survey.objects.create(
            service=self.service,
            survey_date=date.today(),
            survey_period_start=date.today(),
            survey_period_end=date.today(),
            surveyor=self.surveyor
        )
        
        # Draft → Submitted
        survey.verification_status = Survey.Status.SUBMITTED
        survey.save()
        self.assertEqual(survey.verification_status, Survey.Status.SUBMITTED)
        
        # Submitted → Verified
        survey.verification_status = Survey.Status.VERIFIED
        survey.verified_by = self.verifier
        survey.save()
        self.assertEqual(survey.verification_status, Survey.Status.VERIFIED)
