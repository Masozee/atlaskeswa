"""
Management command to seed database with sample data for DESDE-LTC system
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import random

from apps.accounts.models import UserActivityLog
from apps.directory.models import (
    MainTypeOfCare, BasicStableInputsOfCare, TargetPopulation,
    ServiceType, Service
)
from apps.survey.models import Survey, SurveyAttachment, SurveyAuditLog
from apps.logs.models import ActivityLog, VerificationLog, DataChangeLog, SystemError, ImportExportLog

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with sample data for DESDE-LTC system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            self.clear_data()

        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))

        # Seed in order of dependencies
        self.seed_users()
        self.seed_mtc_classifications()
        self.seed_bsic_classifications()
        self.seed_target_populations()
        self.seed_service_types()
        self.seed_services()
        self.seed_surveys()
        self.seed_logs()

        self.stdout.write(self.style.SUCCESS('✅ Database seeding completed successfully!'))

    def clear_data(self):
        """Clear all data from database"""
        Survey.objects.all().delete()
        Service.objects.all().delete()
        ServiceType.objects.all().delete()
        TargetPopulation.objects.all().delete()
        BasicStableInputsOfCare.objects.all().delete()
        MainTypeOfCare.objects.all().delete()
        ActivityLog.objects.all().delete()
        VerificationLog.objects.all().delete()
        DataChangeLog.objects.all().delete()
        SystemError.objects.all().delete()
        ImportExportLog.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.WARNING('Data cleared.'))

    def seed_users(self):
        """Create users with different roles"""
        self.stdout.write('Creating users...')

        users_data = [
            # Admins
            {'email': 'admin@yakkum.id', 'password': 'admin123', 'role': User.Role.ADMIN,
             'first_name': 'System', 'last_name': 'Administrator', 'organization': 'Yakkum DESDE-LTC'},
            {'email': 'admin2@yakkum.id', 'password': 'admin123', 'role': User.Role.ADMIN,
             'first_name': 'Maria', 'last_name': 'Garcia', 'organization': 'Yakkum DESDE-LTC'},

            # Surveyors
            {'email': 'surveyor1@yakkum.id', 'password': 'surveyor123', 'role': User.Role.SURVEYOR,
             'first_name': 'Ahmad', 'last_name': 'Wijaya', 'organization': 'Jakarta Survey Team'},
            {'email': 'surveyor2@yakkum.id', 'password': 'surveyor123', 'role': User.Role.SURVEYOR,
             'first_name': 'Siti', 'last_name': 'Nurhaliza', 'organization': 'Bandung Survey Team'},
            {'email': 'surveyor3@yakkum.id', 'password': 'surveyor123', 'role': User.Role.SURVEYOR,
             'first_name': 'Budi', 'last_name': 'Santoso', 'organization': 'Surabaya Survey Team'},

            # Verifiers
            {'email': 'verifier1@yakkum.id', 'password': 'verifier123', 'role': User.Role.VERIFIER,
             'first_name': 'Dr. Rina', 'last_name': 'Kusuma', 'organization': 'Quality Assurance Team'},
            {'email': 'verifier2@yakkum.id', 'password': 'verifier123', 'role': User.Role.VERIFIER,
             'first_name': 'Dr. Anton', 'last_name': 'Prakoso', 'organization': 'Quality Assurance Team'},

            # Viewers
            {'email': 'viewer1@yakkum.id', 'password': 'viewer123', 'role': User.Role.VIEWER,
             'first_name': 'Lisa', 'last_name': 'Permata', 'organization': 'Research Department'},
            {'email': 'viewer2@yakkum.id', 'password': 'viewer123', 'role': User.Role.VIEWER,
             'first_name': 'Eko', 'last_name': 'Prasetyo', 'organization': 'Data Analytics Team'},
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults=user_data
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(f'  ✓ Created {user.get_role_display()}: {user.email}')

        self.users = User.objects.all()
        self.admin = User.objects.filter(role=User.Role.ADMIN).first()
        self.surveyors = list(User.objects.filter(role=User.Role.SURVEYOR))
        self.verifiers = list(User.objects.filter(role=User.Role.VERIFIER))

    def seed_mtc_classifications(self):
        """Create DESDE-LTC Main Type of Care classifications"""
        self.stdout.write('Creating MTC classifications...')

        mtc_data = [
            {'code': 'R', 'name': 'Residential Care', 'description': '24-hour residential mental health facilities'},
            {'code': 'R1', 'name': 'Acute Inpatient', 'description': 'Acute psychiatric inpatient units'},
            {'code': 'R2', 'name': 'Long-term Residential', 'description': 'Long-term psychiatric residential facilities'},
            {'code': 'R3', 'name': 'Supported Housing', 'description': 'Supported housing for mental health'},

            {'code': 'D', 'name': 'Day Care', 'description': 'Day treatment and rehabilitation centers'},
            {'code': 'D1', 'name': 'Day Hospital', 'description': 'Psychiatric day hospital'},
            {'code': 'D2', 'name': 'Day Center', 'description': 'Mental health day center'},

            {'code': 'O', 'name': 'Outpatient Care', 'description': 'Ambulatory mental health services'},
            {'code': 'O1', 'name': 'Outpatient Clinic', 'description': 'Psychiatric outpatient clinic'},
            {'code': 'O2', 'name': 'Community Mental Health', 'description': 'Community mental health teams'},
            {'code': 'O3', 'name': 'Primary Care Mental Health', 'description': 'Mental health in primary care'},

            {'code': 'A', 'name': 'Accessibility', 'description': 'Crisis and emergency services'},
            {'code': 'A1', 'name': 'Mobile Emergency', 'description': 'Mobile crisis intervention teams'},
            {'code': 'A2', 'name': 'Telephone Helpline', 'description': 'Mental health helplines'},

            {'code': 'W', 'name': 'Work-Related', 'description': 'Vocational and employment services'},
            {'code': 'W1', 'name': 'Sheltered Employment', 'description': 'Sheltered workshop'},
            {'code': 'W2', 'name': 'Supported Employment', 'description': 'Supported employment programs'},
        ]

        for data in mtc_data:
            mtc, created = MainTypeOfCare.objects.get_or_create(
                code=data['code'],
                defaults={'name': data['name'], 'description': data['description']}
            )
            if created:
                self.stdout.write(f'  ✓ Created MTC: {mtc.code} - {mtc.name}')

        self.mtc_list = list(MainTypeOfCare.objects.all())

    def seed_bsic_classifications(self):
        """Create DESDE-LTC Basic Stable Inputs of Care classifications"""
        self.stdout.write('Creating BSIC classifications...')

        bsic_data = [
            {'code': 'A', 'name': 'Accessibility', 'description': 'Service accessibility features'},
            {'code': 'B', 'name': 'Brief Intervention', 'description': 'Brief interventions and consultations'},
            {'code': 'C', 'name': 'Continuity of Care', 'description': 'Continuity and coordination of care'},
            {'code': 'D', 'name': 'Diversity', 'description': 'Cultural and linguistic diversity'},
            {'code': 'E', 'name': 'Effectiveness', 'description': 'Evidence-based practices'},
            {'code': 'F', 'name': 'Family Involvement', 'description': 'Family and caregiver support'},
            {'code': 'G', 'name': 'Geographic Coverage', 'description': 'Geographic service coverage'},
            {'code': 'H', 'name': 'Human Rights', 'description': 'Rights-based approach'},
            {'code': 'I', 'name': 'Integration', 'description': 'Service integration'},
            {'code': 'J', 'name': 'Quality Assurance', 'description': 'Quality monitoring and improvement'},
        ]

        for data in bsic_data:
            bsic, created = BasicStableInputsOfCare.objects.get_or_create(
                code=data['code'],
                defaults={'name': data['name'], 'description': data['description']}
            )
            if created:
                self.stdout.write(f'  ✓ Created BSIC: {bsic.code} - {bsic.name}')

        self.bsic_list = list(BasicStableInputsOfCare.objects.all())

    def seed_target_populations(self):
        """Create target population categories"""
        self.stdout.write('Creating target populations...')

        populations = [
            {'name': 'Adults with Depression', 'description': 'Adults aged 18+ with depression'},
            {'name': 'Adults with Anxiety Disorders', 'description': 'Adults with anxiety disorders'},
            {'name': 'Adults with Schizophrenia', 'description': 'Adults with schizophrenia and psychotic disorders'},
            {'name': 'Adults with Bipolar Disorder', 'description': 'Adults with bipolar disorder'},
            {'name': 'Adults with Substance Use Disorders', 'description': 'Adults with addiction and substance abuse'},
            {'name': 'Children and Adolescents', 'description': 'Children and adolescents (0-17 years)'},
            {'name': 'Older Adults', 'description': 'Older adults (65+ years) with mental health needs'},
            {'name': 'People with Dual Diagnosis', 'description': 'Mental health and intellectual disability'},
            {'name': 'Trauma Survivors', 'description': 'Trauma and PTSD survivors'},
            {'name': 'Eating Disorders', 'description': 'People with eating disorders'},
        ]

        for data in populations:
            pop, created = TargetPopulation.objects.get_or_create(
                name=data['name'],
                defaults={'description': data['description']}
            )
            if created:
                self.stdout.write(f'  ✓ Created target population: {pop.name}')

        self.target_populations = list(TargetPopulation.objects.all())

    def seed_service_types(self):
        """Create service type categories"""
        self.stdout.write('Creating service types...')

        service_types = [
            {'name': 'Psychiatric Hospital', 'description': 'General psychiatric hospital'},
            {'name': 'Community Mental Health Center', 'description': 'Community-based mental health center'},
            {'name': 'Outpatient Clinic', 'description': 'Ambulatory psychiatric clinic'},
            {'name': 'Day Hospital', 'description': 'Psychiatric day treatment facility'},
            {'name': 'Crisis Center', 'description': 'Mental health crisis intervention center'},
            {'name': 'Residential Facility', 'description': 'Long-term residential care'},
            {'name': 'Rehabilitation Center', 'description': 'Psychosocial rehabilitation center'},
            {'name': 'Supported Housing', 'description': 'Supported independent living'},
        ]

        for data in service_types:
            stype, created = ServiceType.objects.get_or_create(
                name=data['name'],
                defaults={'description': data['description']}
            )
            if created:
                self.stdout.write(f'  ✓ Created service type: {stype.name}')

        self.service_types = list(ServiceType.objects.all())

    def seed_services(self):
        """Create mental health services"""
        self.stdout.write('Creating mental health services...')

        cities = [
            ('Jakarta', 'DKI Jakarta', -6.2088, 106.8456),
            ('Bandung', 'West Java', -6.9175, 107.6191),
            ('Surabaya', 'East Java', -7.2575, 112.7521),
            ('Yogyakarta', 'DI Yogyakarta', -7.7956, 110.3695),
            ('Semarang', 'Central Java', -6.9932, 110.4203),
            ('Medan', 'North Sumatra', 3.5952, 98.6722),
            ('Makassar', 'South Sulawesi', -5.1477, 119.4327),
            ('Denpasar', 'Bali', -8.6705, 115.2126),
        ]

        service_templates = [
            {
                'name': 'RSJ {city}',
                'description': 'Provincial psychiatric hospital providing comprehensive mental health services',
                'bed_capacity': (100, 300),
                'psychiatrist_count': (5, 15),
                'psychologist_count': (10, 25),
                'nurse_count': (30, 80),
                'social_worker_count': (5, 15),
            },
            {
                'name': 'Puskesmas Jiwa {city}',
                'description': 'Community mental health center providing primary care mental health services',
                'bed_capacity': (0, 20),
                'psychiatrist_count': (1, 3),
                'psychologist_count': (2, 5),
                'nurse_count': (5, 15),
                'social_worker_count': (2, 5),
            },
            {
                'name': 'Klinik Kesehatan Jiwa {city}',
                'description': 'Outpatient mental health clinic',
                'bed_capacity': (0, 0),
                'psychiatrist_count': (2, 5),
                'psychologist_count': (3, 8),
                'nurse_count': (3, 10),
                'social_worker_count': (1, 3),
            },
        ]

        created_count = 0
        for city, province, lat, lng in cities:
            for template in service_templates:
                service_name = template['name'].format(city=city)

                service, created = Service.objects.get_or_create(
                    name=service_name,
                    defaults={
                        'description': template['description'],
                        'mtc': random.choice(self.mtc_list),
                        'bsic': random.choice(self.bsic_list),
                        'service_type': random.choice(self.service_types),
                        'phone_number': f'+62{random.randint(2000000000, 2999999999)}',
                        'email': f'{service_name.lower().replace(" ", ".")}@example.id',
                        'website': f'https://{service_name.lower().replace(" ", "-")}.id',
                        'address': f'Jl. Kesehatan Jiwa No. {random.randint(1, 999)}',
                        'city': city,
                        'province': province,
                        'postal_code': f'{random.randint(10000, 99999)}',
                        'latitude': Decimal(str(lat + random.uniform(-0.1, 0.1))),
                        'longitude': Decimal(str(lng + random.uniform(-0.1, 0.1))),
                        'bed_capacity': random.randint(*template['bed_capacity']) if template['bed_capacity'][1] > 0 else None,
                        'staff_count': random.randint(10, 100),
                        'psychiatrist_count': random.randint(*template['psychiatrist_count']),
                        'psychologist_count': random.randint(*template['psychologist_count']),
                        'nurse_count': random.randint(*template['nurse_count']),
                        'social_worker_count': random.randint(*template['social_worker_count']),
                        'operating_hours': 'Mon-Fri: 08:00-16:00',
                        'is_24_7': random.choice([True, False]),
                        'accepts_emergency': random.choice([True, False]),
                        'accepts_bpjs': True,
                        'accepts_private_insurance': random.choice([True, False]),
                        'funding_sources': 'Government, BPJS, Private Insurance',
                        'is_verified': random.choice([True, False]),
                        'is_active': True,
                        'created_by': self.admin,
                        'verified_by': random.choice(self.verifiers) if random.choice([True, False]) else None,
                        'verified_at': timezone.now() - timedelta(days=random.randint(1, 30)) if random.choice([True, False]) else None,
                    }
                )

                if created:
                    # Add target populations
                    service.target_populations.set(random.sample(self.target_populations, k=random.randint(2, 5)))
                    created_count += 1

        self.stdout.write(f'  ✓ Created {created_count} mental health services')
        self.services = list(Service.objects.all())

    def seed_surveys(self):
        """Create survey data"""
        self.stdout.write('Creating surveys...')

        created_count = 0
        for service in random.sample(self.services, min(15, len(self.services))):
            for i in range(random.randint(1, 3)):
                survey_date = date.today() - timedelta(days=random.randint(1, 90))

                # Generate GPS location near the service location
                service_lat = float(service.latitude) if service.latitude else -6.2088
                service_lng = float(service.longitude) if service.longitude else 106.8456

                survey, created = Survey.objects.get_or_create(
                    service=service,
                    survey_date=survey_date,
                    defaults={
                        'survey_period_start': survey_date - timedelta(days=30),
                        'survey_period_end': survey_date,
                        'latitude': Decimal(str(service_lat + random.uniform(-0.001, 0.001))),
                        'longitude': Decimal(str(service_lng + random.uniform(-0.001, 0.001))),
                        'location_accuracy': Decimal(str(random.uniform(5.0, 25.0))),
                        'surveyor': random.choice(self.surveyors),
                        'surveyor_notes': random.choice([
                            'Survey completed successfully',
                            'All data verified on site',
                            'Facility was very cooperative',
                            'Some data estimated by facility staff',
                        ]),
                        'verification_status': random.choice([
                            Survey.Status.DRAFT,
                            Survey.Status.SUBMITTED,
                            Survey.Status.VERIFIED,
                        ]),
                        'assigned_verifier': random.choice(self.verifiers) if random.choice([True, False]) else None,
                        'verified_by': random.choice(self.verifiers) if random.choice([True, False]) else None,
                        'verified_at': timezone.now() - timedelta(days=random.randint(1, 15)) if random.choice([True, False]) else None,
                        'current_bed_capacity': service.bed_capacity,
                        'beds_occupied': random.randint(0, service.bed_capacity) if service.bed_capacity else None,
                        'current_staff_count': service.staff_count,
                        'current_psychiatrist_count': service.psychiatrist_count,
                        'current_psychologist_count': service.psychologist_count,
                        'current_nurse_count': service.nurse_count,
                        'current_social_worker_count': service.social_worker_count,
                        'total_patients_served': random.randint(50, 500),
                        'new_patients': random.randint(10, 100),
                        'returning_patients': random.randint(40, 400),
                        'patients_male': random.randint(20, 250),
                        'patients_female': random.randint(20, 250),
                        'patients_age_0_17': random.randint(0, 50),
                        'patients_age_18_64': random.randint(30, 350),
                        'patients_age_65_plus': random.randint(5, 100),
                        'patient_satisfaction_score': Decimal(str(random.uniform(3.5, 5.0))),
                        'average_wait_time_days': random.randint(1, 30),
                        'monthly_budget': Decimal(str(random.randint(50000000, 500000000))),
                        'bpjs_patients': random.randint(30, 300),
                        'private_insurance_patients': random.randint(10, 100),
                        'self_pay_patients': random.randint(10, 100),
                        'submitted_at': timezone.now() - timedelta(days=random.randint(1, 20)) if random.choice([True, False]) else None,
                    }
                )

                if created:
                    created_count += 1

        self.stdout.write(f'  ✓ Created {created_count} surveys')
        self.surveys = list(Survey.objects.all())

    def seed_logs(self):
        """Create log entries"""
        self.stdout.write('Creating log entries...')

        # Activity Logs
        actions = [
            (ActivityLog.Action.LOGIN, ActivityLog.Severity.INFO, 'User logged into system'),
            (ActivityLog.Action.CREATE, ActivityLog.Severity.INFO, 'Created new service record'),
            (ActivityLog.Action.UPDATE, ActivityLog.Severity.INFO, 'Updated survey data'),
            (ActivityLog.Action.EXPORT, ActivityLog.Severity.INFO, 'Exported service data to CSV'),
            (ActivityLog.Action.FILE_UPLOAD, ActivityLog.Severity.INFO, 'Uploaded survey attachment'),
        ]

        for _ in range(30):
            action, severity, description = random.choice(actions)
            ActivityLog.objects.create(
                user=random.choice(self.users),
                username=random.choice(self.users).email,
                action=action,
                severity=severity,
                description=description,
                model_name=random.choice(['Service', 'Survey', 'User']),
                object_repr=f'Object #{random.randint(1, 100)}',
                ip_address=f'192.168.1.{random.randint(1, 255)}',
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                request_method=random.choice(['GET', 'POST', 'PUT']),
                request_path=f'/api/v1/{random.choice(["services", "surveys", "users"])}/',
            )

        # System Errors
        for _ in range(10):
            SystemError.objects.create(
                severity=random.choice([SystemError.Severity.WARNING, SystemError.Severity.ERROR]),
                error_type=random.choice([
                    SystemError.ErrorType.VALIDATION,
                    SystemError.ErrorType.DATABASE,
                    SystemError.ErrorType.API,
                ]),
                error_message=random.choice([
                    'Database connection timeout',
                    'Invalid survey data format',
                    'API rate limit exceeded',
                    'File upload size exceeded',
                ]),
                exception_type=random.choice(['ValidationError', 'DatabaseError', 'TimeoutError']),
                module='apps.survey.views',
                function='create_survey',
                user=random.choice(self.users) if random.choice([True, False]) else None,
                username=random.choice(self.users).email if random.choice([True, False]) else '',
                request_path='/api/v1/surveys/',
                is_resolved=random.choice([True, False]),
            )

        # Import/Export Logs
        for _ in range(8):
            total = random.randint(50, 200)
            success = random.randint(int(total * 0.8), total)
            failed = total - success

            ImportExportLog.objects.create(
                operation=random.choice([ImportExportLog.Operation.IMPORT, ImportExportLog.Operation.EXPORT]),
                status=random.choice([
                    ImportExportLog.Status.COMPLETED,
                    ImportExportLog.Status.PARTIALLY_COMPLETED,
                ]),
                user=random.choice(self.users),
                username=random.choice(self.users).email,
                model_name=random.choice(['Service', 'Survey', 'User']),
                file_format=random.choice([
                    ImportExportLog.Format.CSV,
                    ImportExportLog.Format.EXCEL,
                    ImportExportLog.Format.JSON,
                ]),
                file_name=f'export_{random.randint(1000, 9999)}.csv',
                file_size=random.randint(10000, 5000000),
                total_records=total,
                successful_records=success,
                failed_records=failed,
                duration_seconds=random.randint(5, 120),
                completed_at=timezone.now() - timedelta(hours=random.randint(1, 48)),
            )

        self.stdout.write('  ✓ Created activity logs, system errors, and import/export logs')
