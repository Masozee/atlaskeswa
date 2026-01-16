"""
Seed script for adding DESDE-LTC classification data
This includes MTC, BSIC, Service Types, and Target Populations
Run with: python seed/seed_classifications.py (from backend directory)
"""
import os
import sys
import django

# Add parent directory to path so 'core' module can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.directory.models import MainTypeOfCare, BasicStableInputsOfCare, ServiceType, TargetPopulation

def seed_mtc():
    """Seed Main Type of Care (MTC) classifications"""
    print("Seeding Main Type of Care (MTC) data...")

    mtc_data = [
        # Residential Care
        {
            "code": "R1",
            "name": "Residential Care - 24h medical care",
            "description": "Residential facilities providing 24-hour medical care with psychiatrists and nurses"
        },
        {
            "code": "R2",
            "name": "Residential Care - 24h non-medical care",
            "description": "Residential facilities providing 24-hour non-medical care and support"
        },
        {
            "code": "R3",
            "name": "Residential Care - Non-24h care",
            "description": "Residential facilities with daytime-only or limited hours care"
        },
        # Day Care
        {
            "code": "D1",
            "name": "Day Care - Day and night care",
            "description": "Day care facilities with overnight capacity"
        },
        {
            "code": "D2",
            "name": "Day Care - Day care only",
            "description": "Day care facilities operating during daytime hours only"
        },
        # Outpatient Care
        {
            "code": "O1",
            "name": "Outpatient Care - Acute/post-acute care",
            "description": "Outpatient services for acute and post-acute mental health conditions"
        },
        {
            "code": "O2",
            "name": "Outpatient Care - Long-term/low frequency care",
            "description": "Outpatient services for long-term management with low frequency visits"
        },
        # Accessibility Services
        {
            "code": "A1",
            "name": "Accessibility to Care - Self-help and voluntary services",
            "description": "Self-help groups and voluntary support services"
        },
        {
            "code": "A2",
            "name": "Accessibility to Care - Information services",
            "description": "Information and signposting services for mental health"
        },
        {
            "code": "A3",
            "name": "Accessibility to Care - Emergency services",
            "description": "Emergency and crisis intervention services"
        },
    ]

    created_count = 0
    for data in mtc_data:
        if not MainTypeOfCare.objects.filter(code=data['code']).exists():
            MainTypeOfCare.objects.create(**data)
            created_count += 1
            print(f"✓ Created MTC: {data['code']} - {data['name']}")
        else:
            print(f"- Skipped (exists): {data['code']}")

    print(f"MTC: Created {created_count} new, Total: {MainTypeOfCare.objects.count()}\n")

def seed_bsic():
    """Seed Basic Stable Inputs of Care (BSIC) classifications"""
    print("Seeding Basic Stable Inputs of Care (BSIC) data...")

    bsic_data = [
        # Hospital Care
        {
            "code": "R1.1",
            "name": "Hospital - Psychiatric ward in general hospital",
            "description": "Psychiatric wards integrated within general hospitals"
        },
        {
            "code": "R1.2",
            "name": "Hospital - Psychiatric hospital",
            "description": "Standalone psychiatric hospitals"
        },
        {
            "code": "R1.3",
            "name": "Hospital - Specialized psychiatric unit",
            "description": "Specialized units for specific conditions (forensic, addiction, etc.)"
        },
        # Residential Non-Hospital
        {
            "code": "R2.1",
            "name": "Residential - Supported accommodation",
            "description": "Supported housing with 24h non-medical care"
        },
        {
            "code": "R2.2",
            "name": "Residential - Therapeutic community",
            "description": "Therapeutic communities for mental health recovery"
        },
        {
            "code": "R3.1",
            "name": "Residential - Sheltered housing",
            "description": "Sheltered housing with part-time support"
        },
        # Day Care
        {
            "code": "D1.1",
            "name": "Day Care - Day hospital",
            "description": "Day hospitals with medical care and overnight capacity"
        },
        {
            "code": "D2.1",
            "name": "Day Care - Day center",
            "description": "Day centers for rehabilitation and social activities"
        },
        {
            "code": "D2.2",
            "name": "Day Care - Workshop",
            "description": "Workshops for vocational training and employment"
        },
        # Outpatient
        {
            "code": "O1.1",
            "name": "Outpatient - Acute outpatient clinic",
            "description": "Clinics for acute mental health treatment"
        },
        {
            "code": "O1.2",
            "name": "Outpatient - Community mental health center",
            "description": "Community-based mental health centers"
        },
        {
            "code": "O2.1",
            "name": "Outpatient - Primary care mental health",
            "description": "Mental health services in primary care settings"
        },
        {
            "code": "O2.2",
            "name": "Outpatient - Private practice",
            "description": "Private psychiatric and psychological practices"
        },
        # Accessibility
        {
            "code": "A1.1",
            "name": "Accessibility - Self-help groups",
            "description": "Peer support and self-help groups"
        },
        {
            "code": "A2.1",
            "name": "Accessibility - Helpline services",
            "description": "Telephone and online helplines"
        },
        {
            "code": "A3.1",
            "name": "Accessibility - Mobile crisis team",
            "description": "Mobile crisis intervention teams"
        },
    ]

    created_count = 0
    for data in bsic_data:
        if not BasicStableInputsOfCare.objects.filter(code=data['code']).exists():
            BasicStableInputsOfCare.objects.create(**data)
            created_count += 1
            print(f"✓ Created BSIC: {data['code']} - {data['name']}")
        else:
            print(f"- Skipped (exists): {data['code']}")

    print(f"BSIC: Created {created_count} new, Total: {BasicStableInputsOfCare.objects.count()}\n")

def seed_service_types():
    """Seed Service Types"""
    print("Seeding Service Types data...")

    service_types_data = [
        {
            "name": "Public Hospital",
            "description": "Government-run hospitals and healthcare facilities"
        },
        {
            "name": "Private Hospital",
            "description": "Private healthcare facilities and hospitals"
        },
        {
            "name": "Community Health Center (Puskesmas)",
            "description": "Community health centers (Puskesmas) providing primary care"
        },
        {
            "name": "Mental Health Clinic",
            "description": "Specialized mental health clinics and outpatient centers"
        },
        {
            "name": "Psychiatric Hospital",
            "description": "Standalone psychiatric hospitals"
        },
        {
            "name": "Rehabilitation Center",
            "description": "Mental health rehabilitation and recovery centers"
        },
        {
            "name": "Day Care Center",
            "description": "Day care centers for mental health patients"
        },
        {
            "name": "Residential Care Facility",
            "description": "Residential facilities for long-term mental health care"
        },
        {
            "name": "Crisis Center",
            "description": "Emergency and crisis intervention centers"
        },
        {
            "name": "NGO/Foundation Service",
            "description": "Mental health services provided by NGOs and foundations"
        },
    ]

    created_count = 0
    for data in service_types_data:
        if not ServiceType.objects.filter(name=data['name']).exists():
            ServiceType.objects.create(**data)
            created_count += 1
            print(f"✓ Created Service Type: {data['name']}")
        else:
            print(f"- Skipped (exists): {data['name']}")

    print(f"Service Types: Created {created_count} new, Total: {ServiceType.objects.count()}\n")

def seed_target_populations():
    """Seed Target Populations"""
    print("Seeding Target Populations data...")

    target_populations_data = [
        {
            "name": "Children (0-11)",
            "description": "Children aged 0 to 11 years"
        },
        {
            "name": "Adolescents (12-17)",
            "description": "Adolescents aged 12 to 17 years"
        },
        {
            "name": "Adults (18-64)",
            "description": "Adult population aged 18 to 64 years"
        },
        {
            "name": "Elderly (65+)",
            "description": "Elderly population aged 65 years and above"
        },
        {
            "name": "Women",
            "description": "Women-specific mental health services"
        },
        {
            "name": "Men",
            "description": "Men-specific mental health services"
        },
        {
            "name": "People with Severe Mental Illness",
            "description": "Individuals with severe and persistent mental illness"
        },
        {
            "name": "People with Substance Use Disorders",
            "description": "Individuals with drug and alcohol addiction"
        },
        {
            "name": "People with Intellectual Disabilities",
            "description": "Individuals with intellectual and developmental disabilities"
        },
        {
            "name": "Homeless Population",
            "description": "Homeless individuals requiring mental health services"
        },
        {
            "name": "Veterans",
            "description": "Military veterans requiring mental health support"
        },
        {
            "name": "LGBTQ+",
            "description": "LGBTQ+ community mental health services"
        },
    ]

    created_count = 0
    for data in target_populations_data:
        if not TargetPopulation.objects.filter(name=data['name']).exists():
            TargetPopulation.objects.create(**data)
            created_count += 1
            print(f"✓ Created Target Population: {data['name']}")
        else:
            print(f"- Skipped (exists): {data['name']}")

    print(f"Target Populations: Created {created_count} new, Total: {TargetPopulation.objects.count()}\n")

def main():
    print("="*60)
    print("Starting DESDE-LTC Classification Data Seeding")
    print("="*60 + "\n")

    seed_mtc()
    seed_bsic()
    seed_service_types()
    seed_target_populations()

    print("="*60)
    print("Seeding completed successfully!")
    print("="*60)

if __name__ == '__main__':
    main()
