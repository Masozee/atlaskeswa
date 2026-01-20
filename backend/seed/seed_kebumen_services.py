"""
Seed script for Kabupaten Kebumen mental health services
Run with: python seed/seed_kebumen_services.py (from backend directory)
"""
import os
import sys
import django
import random
import json

# Add parent directory to path so 'core' module can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from decimal import Decimal
from apps.directory.models import Service, MainTypeOfCare, BasicStableInputsOfCare, ServiceType, TargetPopulation
from apps.survey.models import Survey
from apps.accounts.models import User

# Kecamatan data from kebumen.csv with approximate coordinates (center points)
KECAMATAN_DATA = [
    {"name": "Ayah", "dusun": 71, "rw": 82, "rt": 416, "lat": -7.7762, "lng": 109.4110},
    {"name": "Buayan", "dusun": 86, "rw": 90, "rt": 346, "lat": -7.7634, "lng": 109.4567},
    {"name": "Puring", "dusun": 120, "rw": 99, "rt": 320, "lat": -7.7421, "lng": 109.4823},
    {"name": "Petanahan", "dusun": 81, "rw": 80, "rt": 269, "lat": -7.7089, "lng": 109.5234},
    {"name": "Klirong", "dusun": 95, "rw": 101, "rt": 305, "lat": -7.6845, "lng": 109.5612},
    {"name": "Buluspesantren", "dusun": 91, "rw": 89, "rt": 290, "lat": -7.6523, "lng": 109.5987},
    {"name": "Ambal", "dusun": 153, "rw": 116, "rt": 313, "lat": -7.6234, "lng": 109.6345},
    {"name": "Mirit", "dusun": 104, "rw": 69, "rt": 266, "lat": -7.5912, "lng": 109.6678},
    {"name": "Bonorowo", "dusun": 48, "rw": 42, "rt": 139, "lat": -7.5623, "lng": 109.7012},
    {"name": "Prembun", "dusun": 50, "rw": 40, "rt": 139, "lat": -7.5789, "lng": 109.7345},
    {"name": "Padureso", "dusun": 32, "rw": 23, "rt": 85, "lat": -7.5456, "lng": 109.7623},
    {"name": "Kutowinangun", "dusun": 78, "rw": 80, "rt": 245, "lat": -7.6123, "lng": 109.6834},
    {"name": "Alian", "dusun": 62, "rw": 73, "rt": 287, "lat": -7.6456, "lng": 109.6512},
    {"name": "Poncowarno", "dusun": 47, "rw": 34, "rt": 99, "lat": -7.5234, "lng": 109.7234},
    {"name": "Kebumen", "dusun": 113, "rw": 143, "rt": 612, "lat": -7.6712, "lng": 109.6634},  # Capital
    {"name": "Pejagoan", "dusun": 71, "rw": 68, "rt": 266, "lat": -7.6989, "lng": 109.6423},
    {"name": "Sruweng", "dusun": 92, "rw": 99, "rt": 348, "lat": -7.7234, "lng": 109.6212},
    {"name": "Adimulyo", "dusun": 106, "rw": 81, "rt": 231, "lat": -7.6612, "lng": 109.7012},
    {"name": "Kuwarasan", "dusun": 78, "rw": 86, "rt": 248, "lat": -7.6845, "lng": 109.7345},
    {"name": "Rowokele", "dusun": 57, "rw": 61, "rt": 327, "lat": -7.5012, "lng": 109.4234},
    {"name": "Sempor", "dusun": 66, "rw": 78, "rt": 377, "lat": -7.5234, "lng": 109.4567},
    {"name": "Gombong", "dusun": 53, "rw": 82, "rt": 296, "lat": -7.6078, "lng": 109.5123},
    {"name": "Karanganyar", "dusun": 41, "rw": 60, "rt": 243, "lat": -7.5789, "lng": 109.5456},
    {"name": "Karanggayam", "dusun": 74, "rw": 76, "rt": 403, "lat": -7.5456, "lng": 109.4012},
    {"name": "Sadang", "dusun": 29, "rw": 37, "rt": 151, "lat": -7.5123, "lng": 109.3789},
    {"name": "Karangsambung", "dusun": 67, "rw": 64, "rt": 267, "lat": -7.5567, "lng": 109.4789},
]


def clear_existing_data():
    """Clear all existing surveys and services"""
    # Delete surveys first (they reference services)
    survey_count = Survey.objects.count()
    Survey.objects.all().delete()
    print(f"Cleared {survey_count} existing surveys")

    # Then delete services
    service_count = Service.objects.count()
    Service.objects.all().delete()
    print(f"Cleared {service_count} existing services")


def ensure_classifications():
    """Ensure MTC, BSIC, ServiceType, and TargetPopulation exist"""

    # Main Types of Care (MTC) - DESDE-LTC classification
    mtc_data = [
        {"code": "R", "name": "Residential Care", "description": "24-hour residential care services"},
        {"code": "R1", "name": "Residential - Acute", "description": "Acute residential psychiatric care"},
        {"code": "R2", "name": "Residential - Non-acute", "description": "Non-acute residential care"},
        {"code": "D", "name": "Day Care", "description": "Day care services"},
        {"code": "D1", "name": "Day Care - Health", "description": "Health-related day care"},
        {"code": "O", "name": "Outpatient", "description": "Outpatient services"},
        {"code": "O1", "name": "Outpatient - Mobile", "description": "Mobile outpatient services"},
        {"code": "A", "name": "Accessibility", "description": "Accessibility and information services"},
    ]

    for data in mtc_data:
        MainTypeOfCare.objects.get_or_create(code=data["code"], defaults=data)

    # Basic Stable Inputs of Care (BSIC)
    bsic_data = [
        {"code": "R1.1", "name": "Psychiatric Hospital Ward", "description": "Inpatient psychiatric ward"},
        {"code": "R1.2", "name": "Psychiatric Hospital", "description": "Standalone psychiatric hospital"},
        {"code": "R2.1", "name": "Supported Housing", "description": "Supported accommodation"},
        {"code": "D1.1", "name": "Day Hospital", "description": "Day hospital services"},
        {"code": "O1.1", "name": "Community Mental Health Center", "description": "CMHC services"},
        {"code": "O1.2", "name": "Primary Care Mental Health", "description": "Mental health in primary care"},
        {"code": "A1.1", "name": "Information Service", "description": "Mental health information"},
    ]

    for data in bsic_data:
        BasicStableInputsOfCare.objects.get_or_create(code=data["code"], defaults=data)

    # Service Types
    service_types = [
        {"name": "Rumah Sakit Umum", "description": "General hospital with mental health services"},
        {"name": "Rumah Sakit Jiwa", "description": "Psychiatric hospital"},
        {"name": "Puskesmas", "description": "Community health center (Puskesmas)"},
        {"name": "Klinik Pratama", "description": "Primary clinic"},
        {"name": "Klinik Utama", "description": "Main clinic"},
        {"name": "Praktik Dokter", "description": "Doctor's practice"},
        {"name": "Posyandu Jiwa", "description": "Community mental health post"},
    ]

    for data in service_types:
        ServiceType.objects.get_or_create(name=data["name"], defaults=data)

    # Target Populations
    populations = [
        {"name": "Dewasa", "description": "Adult population (18-64 years)"},
        {"name": "Lansia", "description": "Elderly population (65+ years)"},
        {"name": "Anak & Remaja", "description": "Children and adolescents (0-17 years)"},
        {"name": "Semua Usia", "description": "All age groups"},
    ]

    for data in populations:
        TargetPopulation.objects.get_or_create(name=data["name"], defaults=data)

    print("Classifications ensured")


def seed_kebumen_services():
    """Seed mental health services for Kebumen"""

    print("Starting Kebumen Services seed data...")

    # Ensure classifications exist
    ensure_classifications()

    # Get classifications
    mtc_outpatient = MainTypeOfCare.objects.get(code="O")
    mtc_residential = MainTypeOfCare.objects.get(code="R1")
    mtc_day = MainTypeOfCare.objects.get(code="D1")

    bsic_primary = BasicStableInputsOfCare.objects.get(code="O1.2")
    bsic_cmhc = BasicStableInputsOfCare.objects.get(code="O1.1")
    bsic_hospital = BasicStableInputsOfCare.objects.get(code="R1.2")
    bsic_day = BasicStableInputsOfCare.objects.get(code="D1.1")

    st_puskesmas = ServiceType.objects.get(name="Puskesmas")
    st_rsu = ServiceType.objects.get(name="Rumah Sakit Umum")
    st_klinik = ServiceType.objects.get(name="Klinik Pratama")
    st_posyandu = ServiceType.objects.get(name="Posyandu Jiwa")

    tp_all = TargetPopulation.objects.get(name="Semua Usia")
    tp_adult = TargetPopulation.objects.get(name="Dewasa")

    # Get or create user
    user = User.objects.filter(is_staff=True).first()
    if not user:
        user = User.objects.first()

    created_count = 0

    # 1. Create RSUD Kebumen (main hospital)
    rsud_data = {
        "name": "RSUD dr. Soedirman Kebumen",
        "description": "Rumah sakit umum daerah dengan layanan kesehatan jiwa rawat jalan dan rawat inap",
        "mtc": mtc_residential,
        "bsic": bsic_hospital,
        "service_type": st_rsu,
        "city": "Kebumen",
        "province": "Jawa Tengah",
        "address": "Jl. Lingkar Selatan No. 1, Kebumen",
        "phone_number": "(0287) 381052",
        "email": "rsud@kebumenkab.go.id",
        "latitude": Decimal("-7.6712"),
        "longitude": Decimal("109.6634"),
        "bed_capacity": 25,
        "staff_count": 45,
        "psychiatrist_count": 2,
        "psychologist_count": 3,
        "nurse_count": 15,
        "social_worker_count": 2,
        "is_24_7": True,
        "accepts_emergency": True,
        "accepts_bpjs": True,
        "accepts_private_insurance": True,
        "is_verified": True,
        "is_active": True,
        "created_by": user,
    }

    rsud, created = Service.objects.get_or_create(name=rsud_data["name"], defaults=rsud_data)
    if created:
        rsud.target_populations.add(tp_all)
        created_count += 1
        print(f"Created: {rsud.name}")

    # 2. Create Puskesmas for each Kecamatan
    for kec in KECAMATAN_DATA:
        # Main Puskesmas
        puskesmas_data = {
            "name": f"Puskesmas {kec['name']}",
            "description": f"Pusat kesehatan masyarakat Kecamatan {kec['name']} dengan layanan kesehatan jiwa",
            "mtc": mtc_outpatient,
            "bsic": bsic_primary,
            "service_type": st_puskesmas,
            "city": "Kebumen",
            "province": "Jawa Tengah",
            "address": f"Kecamatan {kec['name']}, Kabupaten Kebumen",
            "phone_number": f"(0287) {random.randint(300000, 399999)}",
            "latitude": Decimal(str(kec['lat'] + random.uniform(-0.005, 0.005))),
            "longitude": Decimal(str(kec['lng'] + random.uniform(-0.005, 0.005))),
            "bed_capacity": 0,
            "staff_count": random.randint(15, 30),
            "psychiatrist_count": 0,
            "psychologist_count": random.randint(0, 1),
            "nurse_count": random.randint(3, 8),
            "social_worker_count": random.randint(0, 2),
            "is_24_7": kec['name'] in ['Kebumen', 'Gombong', 'Prembun', 'Kutowinangun'],  # Larger areas
            "accepts_emergency": kec['name'] in ['Kebumen', 'Gombong'],
            "accepts_bpjs": True,
            "accepts_private_insurance": False,
            "is_verified": random.choice([True, True, True, False]),  # 75% verified
            "is_active": True,
            "created_by": user,
        }

        puskesmas, created = Service.objects.get_or_create(
            name=puskesmas_data["name"],
            defaults=puskesmas_data
        )
        if created:
            puskesmas.target_populations.add(tp_all)
            created_count += 1
            print(f"Created: {puskesmas.name}")

    # 3. Create some Posyandu Jiwa in select kecamatan
    posyandu_kecamatan = ['Kebumen', 'Gombong', 'Prembun', 'Kutowinangun', 'Pejagoan',
                          'Alian', 'Ambal', 'Buluspesantren', 'Klirong', 'Petanahan']

    for kec_name in posyandu_kecamatan:
        kec = next((k for k in KECAMATAN_DATA if k['name'] == kec_name), None)
        if kec:
            posyandu_data = {
                "name": f"Posyandu Jiwa {kec['name']}",
                "description": f"Pos pelayanan kesehatan jiwa berbasis masyarakat di Kecamatan {kec['name']}",
                "mtc": mtc_outpatient,
                "bsic": bsic_cmhc,
                "service_type": st_posyandu,
                "city": "Kebumen",
                "province": "Jawa Tengah",
                "address": f"Kecamatan {kec['name']}, Kabupaten Kebumen",
                "latitude": Decimal(str(kec['lat'] + random.uniform(-0.008, 0.008))),
                "longitude": Decimal(str(kec['lng'] + random.uniform(-0.008, 0.008))),
                "bed_capacity": 0,
                "staff_count": random.randint(3, 8),
                "psychiatrist_count": 0,
                "psychologist_count": 0,
                "nurse_count": random.randint(1, 3),
                "social_worker_count": random.randint(1, 2),
                "is_24_7": False,
                "accepts_emergency": False,
                "accepts_bpjs": True,
                "accepts_private_insurance": False,
                "is_verified": random.choice([True, False]),
                "is_active": True,
                "created_by": user,
            }

            posyandu, created = Service.objects.get_or_create(
                name=posyandu_data["name"],
                defaults=posyandu_data
            )
            if created:
                posyandu.target_populations.add(tp_all)
                created_count += 1
                print(f"Created: {posyandu.name}")

    # 4. Create a few private clinics in larger areas
    clinic_locations = [
        {"kec": "Kebumen", "name": "Klinik Jiwa Sehat Kebumen"},
        {"kec": "Gombong", "name": "Klinik Pratama Jiwa Gombong"},
        {"kec": "Prembun", "name": "Klinik Kesehatan Jiwa Prembun"},
    ]

    for clinic in clinic_locations:
        kec = next((k for k in KECAMATAN_DATA if k['name'] == clinic['kec']), None)
        if kec:
            clinic_data = {
                "name": clinic['name'],
                "description": f"Klinik kesehatan jiwa swasta di Kecamatan {clinic['kec']}",
                "mtc": mtc_outpatient,
                "bsic": bsic_cmhc,
                "service_type": st_klinik,
                "city": "Kebumen",
                "province": "Jawa Tengah",
                "address": f"Jl. Raya {clinic['kec']}, Kabupaten Kebumen",
                "phone_number": f"(0287) {random.randint(400000, 499999)}",
                "latitude": Decimal(str(kec['lat'] + random.uniform(-0.003, 0.003))),
                "longitude": Decimal(str(kec['lng'] + random.uniform(-0.003, 0.003))),
                "bed_capacity": 0,
                "staff_count": random.randint(5, 12),
                "psychiatrist_count": random.randint(1, 2),
                "psychologist_count": random.randint(1, 3),
                "nurse_count": random.randint(2, 4),
                "social_worker_count": random.randint(0, 1),
                "is_24_7": False,
                "accepts_emergency": False,
                "accepts_bpjs": True,
                "accepts_private_insurance": True,
                "is_verified": True,
                "is_active": True,
                "created_by": user,
            }

            klinik, created = Service.objects.get_or_create(
                name=clinic_data["name"],
                defaults=clinic_data
            )
            if created:
                klinik.target_populations.add(tp_adult)
                created_count += 1
                print(f"Created: {klinik.name}")

    print(f"\nSeed completed! Created {created_count} new services.")
    print(f"Total services in database: {Service.objects.count()}")


def main():
    """Main function"""
    import argparse
    parser = argparse.ArgumentParser(description='Seed Kebumen mental health services')
    parser.add_argument('--clear', action='store_true', help='Clear existing services before seeding')
    args = parser.parse_args()

    if args.clear:
        clear_existing_data()

    seed_kebumen_services()


if __name__ == '__main__':
    main()
