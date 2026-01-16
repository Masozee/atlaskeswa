# Database Seed Scripts

This directory contains scripts for seeding the database with initial and test data.

## Available Seed Scripts

### 1. Classifications ([seed_classifications.py](seed_classifications.py))

Seeds classification data for the directory system:
- **Main Type of Care (MTC)** - Healthcare service classifications
- **Basic Stable Inputs of Care (BSIC)** - Healthcare facility input classifications
- **Target Population** - Population groups served

**Usage:**
```bash
cd /Users/pro/Dev/yakkum/backend
python seed/seed_classifications.py
```

**What it creates:**
- MTC hierarchical structure (parent-child relationships)
- BSIC entries with codes and descriptions
- Target population categories

### 2. Services ([seed_services.py](seed_services.py))

Seeds service/facility data:
- Healthcare facilities/services
- Location data (coordinates, address)
- Service metadata (bed capacity, staff count, operating hours)
- Service relationships (MTC, BSIC, target populations)

**Usage:**
```bash
cd /Users/pro/Dev/yakkum/backend
python seed/seed_services.py
```

**Prerequisites:**
- Classifications must be seeded first
- At least one user with SURVEYOR or ADMIN role

**What it creates:**
- Multiple healthcare service entries
- Realistic service data with Indonesian locations
- Associations with MTC, BSIC, and target populations

### 3. Audit Logs ([seed_audit_logs.py](seed_audit_logs.py))

Seeds audit log data for testing:
- Activity logs
- Verification logs
- Data change logs
- System errors
- Import/export logs

**Usage:**
```bash
cd /Users/pro/Dev/yakkum/backend
python seed/seed_audit_logs.py
```

**Prerequisites:**
- Users must exist in the database
- Services and surveys are recommended for realistic logs

**What it creates:**
- Various types of log entries
- Logs with different severities
- Time-distributed log entries

## Execution Order

For a complete database setup, run scripts in this order:

```bash
# 1. Create superuser first (if not exists)
python manage.py createsuperuser

# 2. Seed classifications
python seed/seed_classifications.py

# 3. Seed services
python seed/seed_services.py

# 4. Seed audit logs (optional)
python seed/seed_audit_logs.py
```

## Script Structure

Each seed script follows this pattern:

```python
#!/usr/bin/env python
import os
import django

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Import models
from apps.directory.models import MainTypeOfCare
# ... other imports

def seed_data():
    """Seed database with data"""
    # Implementation
    pass

if __name__ == '__main__':
    seed_data()
```

## Best Practices

### Running Seed Scripts

1. **Always run from backend directory:**
   ```bash
   cd /Users/pro/Dev/yakkum/backend
   python seed/script_name.py
   ```

2. **Check prerequisites** before running (e.g., required users or data)

3. **Run in correct order** (classifications → services → logs)

4. **Review output** - scripts print what they're creating

### Creating New Seed Scripts

1. **Copy existing script** as template
2. **Include Django setup** at the top
3. **Add clear output messages** showing progress
4. **Handle existing data** gracefully (check before creating)
5. **Document prerequisites** in script docstring
6. **Add to this README** with usage instructions

### Idempotency

Seed scripts should be idempotent when possible:
- Check if data exists before creating
- Use `get_or_create()` instead of `create()`
- Clear existing data if reseeding is needed

Example:
```python
mtc, created = MainTypeOfCare.objects.get_or_create(
    code='A',
    defaults={'name': 'Primary Care', 'is_active': True}
)
if created:
    print(f"✓ Created MTC: {mtc.name}")
else:
    print(f"- MTC already exists: {mtc.name}")
```

## Testing with Seed Data

After seeding, test with different user roles:

```bash
# Create test users
python manage.py shell

from django.contrib.auth import get_user_model
User = get_user_model()

# Create admin
admin = User.objects.create_user(
    email='admin@test.com',
    password='admin123',
    role='ADMIN'
)

# Create surveyor
surveyor = User.objects.create_user(
    email='surveyor@test.com',
    password='surveyor123',
    role='SURVEYOR'
)
```

## Troubleshooting

### Script doesn't run

**Problem:** Module not found errors

**Solution:** Make sure you're running from backend directory:
```bash
cd /Users/pro/Dev/yakkum/backend
python seed/script_name.py
```

### Foreign key errors

**Problem:** Related objects don't exist

**Solution:** Run scripts in correct order:
1. Classifications first
2. Services second (requires classifications)
3. Logs last (requires users and optionally services)

### Duplicate key errors

**Problem:** Data already exists in database

**Solution:** Either:
- Delete existing data manually
- Modify script to use `get_or_create()`
- Clear database and reseed from scratch

### Database locked

**Problem:** SQLite database is locked

**Solution:**
- Close any Django shell sessions
- Stop the development server
- Try again

## Cleaning Database

To start fresh:

```bash
# Delete database (SQLite)
rm db.sqlite3

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Reseed data
python seed/seed_classifications.py
python seed/seed_services.py
python seed/seed_audit_logs.py
```

## Documentation

For more details on seed data structure and content, see:
- [SEED_DATA.md](../docs/SEED_DATA.md) - Detailed documentation of seed data

## Contributing

When adding new seed scripts:

1. Follow the existing pattern
2. Add clear docstrings
3. Include usage instructions in this README
4. Test script from clean database
5. Document any prerequisites
6. Add to execution order if relevant
