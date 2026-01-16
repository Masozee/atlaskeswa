# Seed Data Documentation

## Overview

The DESDE-LTC system includes a comprehensive seed data command that populates the database with realistic sample data for development and testing.

## Command Usage

### Seed Database
```bash
python manage.py seed_data
```

### Clear and Re-seed
```bash
python manage.py seed_data --clear
```

## Seeded Data

### 👥 Users (10 total)

**Administrators (2)**
- `admin@yakkum.id` / `admin123` - System Administrator
- `admin2@yakkum.id` / `admin123` - Maria Garcia

**Surveyors/Enumerators (3)**
- `surveyor1@yakkum.id` / `surveyor123` - Ahmad Wijaya (Jakarta Survey Team)
- `surveyor2@yakkum.id` / `surveyor123` - Siti Nurhaliza (Bandung Survey Team)
- `surveyor3@yakkum.id` / `surveyor123` - Budi Santoso (Surabaya Survey Team)

**Verifiers (2)**
- `verifier1@yakkum.id` / `verifier123` - Dr. Rina Kusuma (Quality Assurance)
- `verifier2@yakkum.id` / `verifier123` - Dr. Anton Prakoso (Quality Assurance)

**Viewers/Analysts (3)**
- `viewer1@yakkum.id` / `viewer123` - Lisa Permata (Research Department)
- `viewer2@yakkum.id` / `viewer123` - Eko Prasetyo (Data Analytics)

### 📊 DESDE-LTC Classifications

**Main Type of Care (MTC) - 17 codes**
- **R-series**: Residential Care (R, R1, R2, R3)
- **D-series**: Day Care (D, D1, D2)
- **O-series**: Outpatient Care (O, O1, O2, O3)
- **A-series**: Accessibility/Crisis (A, A1, A2)
- **W-series**: Work-Related (W, W1, W2)

**Basic Stable Inputs of Care (BSIC) - 10 codes**
- A: Accessibility
- B: Brief Intervention
- C: Continuity of Care
- D: Diversity
- E: Effectiveness
- F: Family Involvement
- G: Geographic Coverage
- H: Human Rights
- I: Integration
- J: Quality Assurance

### 🎯 Target Populations (10)
1. Adults with Depression
2. Adults with Anxiety Disorders
3. Adults with Schizophrenia
4. Adults with Bipolar Disorder
5. Adults with Substance Use Disorders
6. Children and Adolescents
7. Older Adults
8. People with Dual Diagnosis
9. Trauma Survivors
10. Eating Disorders

### 🏥 Service Types (8)
1. Psychiatric Hospital
2. Community Mental Health Center
3. Outpatient Clinic
4. Day Hospital
5. Crisis Center
6. Residential Facility
7. Rehabilitation Center
8. Supported Housing

### 🏥 Mental Health Services (24 services)

**Coverage**: 8 major Indonesian cities
- Jakarta (DKI Jakarta)
- Bandung (West Java)
- Surabaya (East Java)
- Yogyakarta (DI Yogyakarta)
- Semarang (Central Java)
- Medan (North Sumatra)
- Makassar (South Sulawesi)
- Denpasar (Bali)

**Service Templates per City**:
1. **RSJ {City}** - Provincial Psychiatric Hospital
   - Bed capacity: 100-300 beds
   - Staff: 5-15 psychiatrists, 10-25 psychologists, 30-80 nurses, 5-15 social workers
   - Comprehensive inpatient and outpatient services

2. **Puskesmas Jiwa {City}** - Community Mental Health Center
   - Bed capacity: 0-20 beds
   - Staff: 1-3 psychiatrists, 2-5 psychologists, 5-15 nurses, 2-5 social workers
   - Primary mental health care

3. **Klinik Kesehatan Jiwa {City}** - Outpatient Mental Health Clinic
   - No beds (outpatient only)
   - Staff: 2-5 psychiatrists, 3-8 psychologists, 3-10 nurses, 1-3 social workers
   - Ambulatory services

**Service Features**:
- ✅ Geographic coordinates (latitude/longitude)
- ✅ Contact information (phone, email, website)
- ✅ Operating hours and 24/7 availability
- ✅ Emergency service capability
- ✅ Insurance acceptance (BPJS, private)
- ✅ Target populations (2-5 per service)
- ✅ Verification status (random)

### 📋 Surveys (~29 surveys)

**Distribution**:
- Covers 15 randomly selected services
- 1-3 surveys per service
- Survey dates: Last 90 days

**Survey Data Includes**:
- **Capacity**: Bed capacity and occupancy
- **Staffing**: Current staff counts by profession
- **Service Utilization**: Total patients, new vs returning
- **Demographics**: Age groups (0-17, 18-64, 65+), gender
- **Quality Indicators**: Patient satisfaction (3.5-5.0), wait times
- **Financial**: Monthly budget, payment types (BPJS, insurance, self-pay)
- **Notes**: Surveyor observations

**Verification Status**:
- Draft: ~34%
- Submitted: ~17%
- Verified: ~48%

### 📝 Logs

**Activity Logs (30 entries)**
- User login events
- Service record creation
- Survey data updates
- Data exports
- File uploads
- Request metadata (IP, user agent, HTTP method)

**System Errors (10 entries)**
- Severity: Warning & Error levels
- Types: Validation, Database, API errors
- Error messages and stack traces
- Resolution status (random)

**Import/Export Logs (8 entries)**
- Operations: Import & Export
- File formats: CSV, Excel, JSON
- Success rates: 80-100%
- Processing statistics
- Duration tracking

## Data Characteristics

### Realistic Data
- **Phone numbers**: Indonesian format (+62xxx)
- **Addresses**: Indonesian street names (Jl. Kesehatan Jiwa)
- **Postal codes**: 5-digit Indonesian format
- **Cities**: Major Indonesian cities
- **Geographic coordinates**: Actual city coordinates with randomization
- **Budget**: Realistic ranges (50-500 million IDR)
- **Patient satisfaction**: 3.5-5.0 scale

### Random Variation
- Bed occupancy varies by capacity
- Staff counts appropriate to facility size
- Patient demographics distributed realistically
- Service features randomized (24/7, emergency, insurance)
- Verification status varies
- Survey completion status varies

### Relational Integrity
- All services have proper MTC/BSIC classifications
- Services linked to creators and verifiers
- Surveys linked to services and surveyors
- Target populations assigned to services (many-to-many)
- Logs linked to users and actions

## Use Cases

### Development
```bash
# Fresh start for development
python manage.py migrate
python manage.py seed_data
```

### Testing
```bash
# Reset data between tests
python manage.py seed_data --clear
```

### Demo
```bash
# Populate for demonstrations
python manage.py seed_data
```

## Admin Access

Access the Django admin panel at: http://127.0.0.1:8000/admin/

**Login Credentials**:
- Email: `admin@yakkum.id`
- Password: `admin123`

## API Testing

With seeded data, you can test:
- User authentication with different roles
- Service filtering by city, province, MTC, BSIC
- Survey data with various verification statuses
- Verification workflow
- Report generation
- Data export functionality

## Notes

- All passwords for test users are role-based:
  - Admins: `admin123`
  - Surveyors: `surveyor123`
  - Verifiers: `verifier123`
  - Viewers: `viewer123`

- Email format: `{role}{number}@yakkum.id`

- Username auto-generated from email (e.g., `admin@yakkum.id` → `admin`)

- Data is randomized on each run for variety

- Safe to run multiple times (uses `get_or_create`)

## Future Enhancements

Potential additions:
- Survey attachments with sample files
- More historical survey data (multiple periods)
- Verification logs for survey workflow
- Data change logs for audit trail
- Geographic clustering for services
- Seasonal variations in patient data
