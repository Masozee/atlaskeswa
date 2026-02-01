# DESDE-LTC Complete Seed Script

## Overview

The `seed_desde_ltc_complete.py` script contains **all 196 DESDE-LTC codes** extracted from the official DESDE-LTC documentation, including both healthcare and non-healthcare facilities.

## Code Breakdown

### Healthcare Facilities (111 codes)

- **R Series - Residential Care**: 25 codes
  - Root: R (Layanan Rawat Inap)
  - Includes acute and non-acute residential care with various levels of medical staffing

- **D Series - Day Care**: 31 codes
  - Root: D (Layanan Perawatan Harian)
  - Includes acute episodic/continuous care and non-acute work/non-work programs

- **O Series - Outpatient Care**: 37 codes
  - Root: O (Layanan Rawat Jalan)
  - Includes visit-based and facility-based services with various intensities

- **A Series - Accessibility**: 6 codes
  - Root: A (Layanan Aksesibilitas terhadap Perawatan)
  - Communication, mobility, personal support, case coordination

- **I Series - Information**: 12 codes
  - Root: I (Layanan Informasi)
  - Consultation, assessment, and information provision services

### Non-Healthcare Facilities (85 codes)

- **SR Series - Social Residential**: 17 codes
  - Root: SR (Layanan Rawat Inap)
  - Healthcare and non-healthcare staffed residential facilities

- **SD Series - Social Day Care**: 29 codes
  - Root: SD (Layanan Perawatan Harian)
  - Employment-related and non-employment structured/unstructured programs

- **SO Series - Social Outpatient**: 21 codes
  - Root: SO (Layanan Rawat Jalan)
  - Visit-based and facility-based social services with various frequencies

- **SA Series - Social Accessibility**: 6 codes
  - Root: SA (Layanan Aksesibilitas terhadap Perawatan)
  - Same structure as healthcare accessibility

- **SI Series - Social Information**: 12 codes
  - Root: SI (Layanan Informasi)
  - Social consultation, assessment, and information services

## Usage

```bash
cd backend
python seed/seed_desde_ltc_complete.py
```

## Features

- **Idempotent**: Safe to run multiple times, skips existing codes
- **Hierarchical Processing**: Creates root codes first, then children in order
- **Parent-Child Relationships**: Automatically establishes proper hierarchies
- **Progress Tracking**: Shows detailed progress during seeding
- **Validation**: Counts and verifies all codes after seeding

## Data Structure

Each code includes:
- `code`: The DESDE-LTC code (e.g., "R3.1.1")
- `name`: Full Indonesian name
- `description`: Same as name
- `parent`: Reference to parent code or None for root
- `is_active`: True by default

## Source

All codes extracted from official DESDE-LTC documentation:
- File: `260126_Kuesioner DESDE-LTC - Kode R.md`
- Date: January 26, 2026
- Format: Markdown tables with hierarchical code structure

## Notes

- The original user request mentioned 174 codes, but the complete DESDE-LTC system contains 196 codes
- All codes are in Indonesian (Bahasa Indonesia)
- Codes follow hierarchical dot notation (e.g., R3.1.1 is child of R3)
- Root codes (R, D, O, A, I, SR, SD, SO, SA, SI) have `parent=None`
