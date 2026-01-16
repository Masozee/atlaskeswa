"""
Seed script for adding sample Services data
Run with: python seed/seed_services.py (from backend directory)
"""
import os
import sys
import django

# Add parent directory to path so 'core' module can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.directory.models import Service, MainTypeOfCare, BasicStableInputsOfCare, ServiceType, TargetPopulation
from apps.accounts.models import User

def seed_services():
    print("Starting Services seed data...")

    # Check if we have the necessary reference data
    if not MainTypeOfCare.objects.exists():
        print("Creating sample MTC data...")
        mtc1 = MainTypeOfCare.objects.create(
            code="R1",
            name="Residential Care - 24h medical care",
            description="Residential facilities providing 24-hour medical care"
        )
        mtc2 = MainTypeOfCare.objects.create(
            code="R2",
            name="Residential Care - 24h non-medical care",
            description="Residential facilities providing 24-hour non-medical care"
        )
        mtc3 = MainTypeOfCare.objects.create(
            code="D1",
            name="Day Care - Day and night care",
            description="Day care facilities with overnight capacity"
        )
    else:
        mtc1 = MainTypeOfCare.objects.first()
        mtc2 = MainTypeOfCare.objects.all()[1] if MainTypeOfCare.objects.count() > 1 else mtc1
        mtc3 = MainTypeOfCare.objects.all()[2] if MainTypeOfCare.objects.count() > 2 else mtc1

    if not BasicStableInputsOfCare.objects.exists():
        print("Creating sample BSIC data...")
        bsic1 = BasicStableInputsOfCare.objects.create(
            code="R1.1",
            name="Hospital - Psychiatric ward",
            description="Psychiatric wards in general hospitals"
        )
        bsic2 = BasicStableInputsOfCare.objects.create(
            code="R1.2",
            name="Hospital - Psychiatric hospital",
            description="Standalone psychiatric hospitals"
        )
        bsic3 = BasicStableInputsOfCare.objects.create(
            code="R2.1",
            name="Housing - Supported accommodation",
            description="Supported accommodation for mental health"
        )
    else:
        bsic1 = BasicStableInputsOfCare.objects.first()
        bsic2 = BasicStableInputsOfCare.objects.all()[1] if BasicStableInputsOfCare.objects.count() > 1 else bsic1
        bsic3 = BasicStableInputsOfCare.objects.all()[2] if BasicStableInputsOfCare.objects.count() > 2 else bsic1

    if not ServiceType.objects.exists():
        print("Creating sample Service Type data...")
        st1 = ServiceType.objects.create(name="Public Hospital", description="Government-run hospitals")
        st2 = ServiceType.objects.create(name="Private Hospital", description="Private healthcare facilities")
        st3 = ServiceType.objects.create(name="Community Health Center", description="Puskesmas and community clinics")
        st4 = ServiceType.objects.create(name="Mental Health Clinic", description="Specialized mental health clinics")
    else:
        st1 = ServiceType.objects.first()
        st2 = ServiceType.objects.all()[1] if ServiceType.objects.count() > 1 else st1
        st3 = ServiceType.objects.all()[2] if ServiceType.objects.count() > 2 else st1
        st4 = ServiceType.objects.all()[3] if ServiceType.objects.count() > 3 else st1

    if not TargetPopulation.objects.exists():
        print("Creating sample Target Population data...")
        tp1 = TargetPopulation.objects.create(name="Adults", description="Adult population (18-64)")
        tp2 = TargetPopulation.objects.create(name="Elderly", description="Elderly population (65+)")
        tp3 = TargetPopulation.objects.create(name="Children & Adolescents", description="Children and adolescents (0-17)")
    else:
        tp1 = TargetPopulation.objects.first()
        tp2 = TargetPopulation.objects.all()[1] if TargetPopulation.objects.count() > 1 else tp1
        tp3 = TargetPopulation.objects.all()[2] if TargetPopulation.objects.count() > 2 else tp1

    # Get or create a user for created_by
    user = User.objects.filter(is_staff=True).first()
    if not user:
        user = User.objects.first()

    # Sample services data
    services_data = [
        {
            "name": "RS Jiwa Jakarta",
            "description": "Provincial psychiatric hospital providing comprehensive mental health services",
            "mtc": mtc1,
            "bsic": bsic2,
            "service_type": st1,
            "city": "Jakarta Pusat",
            "province": "DKI Jakarta",
            "address": "Jl. Raya Jakarta No. 123",
            "phone_number": "021-1234567",
            "email": "info@rsjjakarta.go.id",
            "bed_capacity": 250,
            "staff_count": 120,
            "psychiatrist_count": 15,
            "psychologist_count": 20,
            "nurse_count": 60,
            "social_worker_count": 10,
            "is_24_7": True,
            "accepts_emergency": True,
            "accepts_bpjs": True,
            "accepts_private_insurance": True,
            "is_verified": True,
            "is_active": True,
        },
        {
            "name": "RSU Soetomo - Psychiatric Ward",
            "description": "Psychiatric ward in general hospital",
            "mtc": mtc1,
            "bsic": bsic1,
            "service_type": st1,
            "city": "Surabaya",
            "province": "Jawa Timur",
            "address": "Jl. Prof. Dr. Moestopo No. 6-8",
            "phone_number": "031-5501111",
            "email": "info@rssoetomo.go.id",
            "bed_capacity": 50,
            "staff_count": 45,
            "psychiatrist_count": 8,
            "psychologist_count": 10,
            "nurse_count": 20,
            "social_worker_count": 5,
            "is_24_7": True,
            "accepts_emergency": True,
            "accepts_bpjs": True,
            "accepts_private_insurance": False,
            "is_verified": True,
            "is_active": True,
        },
        {
            "name": "Klinik Jiwa Sehat Bandung",
            "description": "Private mental health clinic offering outpatient services",
            "mtc": mtc3,
            "bsic": bsic3,
            "service_type": st4,
            "city": "Bandung",
            "province": "Jawa Barat",
            "address": "Jl. Dago No. 45",
            "phone_number": "022-2501234",
            "email": "contact@klinikjiwa.com",
            "bed_capacity": 0,
            "staff_count": 15,
            "psychiatrist_count": 3,
            "psychologist_count": 8,
            "nurse_count": 2,
            "social_worker_count": 2,
            "is_24_7": False,
            "accepts_emergency": False,
            "accepts_bpjs": True,
            "accepts_private_insurance": True,
            "is_verified": True,
            "is_active": True,
        },
        {
            "name": "Puskesmas Kesehatan Jiwa Semarang",
            "description": "Community health center with mental health services",
            "mtc": mtc3,
            "bsic": bsic3,
            "service_type": st3,
            "city": "Semarang",
            "province": "Jawa Tengah",
            "address": "Jl. Pemuda No. 100",
            "phone_number": "024-3512345",
            "bed_capacity": 0,
            "staff_count": 10,
            "psychiatrist_count": 1,
            "psychologist_count": 3,
            "nurse_count": 5,
            "social_worker_count": 1,
            "is_24_7": False,
            "accepts_emergency": False,
            "accepts_bpjs": True,
            "accepts_private_insurance": False,
            "is_verified": False,
            "is_active": True,
        },
        {
            "name": "RS Jiwa Prof. Dr. Soerojo Magelang",
            "description": "Provincial psychiatric hospital in Central Java",
            "mtc": mtc1,
            "bsic": bsic2,
            "service_type": st1,
            "city": "Magelang",
            "province": "Jawa Tengah",
            "address": "Jl. Ki Mangunsarkoro No. 1",
            "phone_number": "0293-363601",
            "bed_capacity": 300,
            "staff_count": 150,
            "psychiatrist_count": 20,
            "psychologist_count": 25,
            "nurse_count": 80,
            "social_worker_count": 15,
            "is_24_7": True,
            "accepts_emergency": True,
            "accepts_bpjs": True,
            "accepts_private_insurance": True,
            "is_verified": True,
            "is_active": True,
        },
        {
            "name": "Klinik Pratama Jiwa Yogyakarta",
            "description": "Primary mental health clinic",
            "mtc": mtc3,
            "bsic": bsic3,
            "service_type": st4,
            "city": "Yogyakarta",
            "province": "DI Yogyakarta",
            "address": "Jl. Malioboro No. 50",
            "phone_number": "0274-580123",
            "bed_capacity": 0,
            "staff_count": 12,
            "psychiatrist_count": 2,
            "psychologist_count": 6,
            "nurse_count": 3,
            "social_worker_count": 1,
            "is_24_7": False,
            "accepts_emergency": False,
            "accepts_bpjs": True,
            "accepts_private_insurance": True,
            "is_verified": False,
            "is_active": True,
        },
    ]

    # Create services only if they don't exist (check by name)
    created_count = 0
    for service_data in services_data:
        service_name = service_data['name']
        if not Service.objects.filter(name=service_name).exists():
            if user:
                service_data['created_by'] = user

            service = Service.objects.create(**service_data)

            # Add target populations
            service.target_populations.add(tp1, tp2)

            created_count += 1
            print(f"✓ Created service: {service_name}")
        else:
            print(f"- Skipped (already exists): {service_name}")

    print(f"\nSeed completed! Created {created_count} new services.")
    print(f"Total services in database: {Service.objects.count()}")

if __name__ == '__main__':
    seed_services()
