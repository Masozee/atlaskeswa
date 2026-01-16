# Backend Folder Structure

This document describes the organized folder structure of the Yakkum backend.

## Directory Layout

```
backend/
├── core/                      # Django project settings and configuration
│   ├── settings.py            # Main settings file
│   ├── urls.py                # Root URL configuration
│   ├── wsgi.py                # WSGI entry point
│   └── asgi.py                # ASGI entry point
│
├── apps/                      # Django applications
│   ├── accounts/              # User authentication and RBAC
│   │   ├── models.py          # User, UserActivityLog models
│   │   ├── views.py           # User management views
│   │   ├── permissions.py     # RBAC permission classes
│   │   ├── middleware.py      # RBAC middleware
│   │   ├── mixins.py          # RBAC queryset filtering mixins
│   │   ├── filters.py         # RBAC filter utilities
│   │   ├── tests_rbac.py      # RBAC permission tests
│   │   └── tests_mixins.py    # RBAC mixin tests
│   │
│   ├── analytics/             # Analytics and tracking
│   │   ├── models.py          # Analytics models
│   │   └── views.py           # Analytics views
│   │
│   ├── directory/             # Service directory
│   │   ├── models.py          # Service, MTC, BSIC, TargetPopulation
│   │   ├── views.py           # Directory views
│   │   └── serializers.py     # Directory serializers
│   │
│   ├── survey/                # Survey management
│   │   ├── models.py          # Survey, SurveyAttachment, SurveyAuditLog
│   │   ├── views.py           # Survey views with verification workflow
│   │   └── serializers.py     # Survey serializers
│   │
│   ├── logs/                  # Logging system
│   │   ├── models.py          # ActivityLog, VerificationLog, DataChangeLog, etc.
│   │   ├── views.py           # Log views
│   │   └── serializers.py     # Log serializers
│   │
│   └── help/                  # Help and support
│       ├── models.py          # HelpCategory, HelpArticle, FAQ, SupportTicket
│       ├── views.py           # Help views
│       └── serializers.py     # Help serializers
│
├── docs/                      # 📚 Documentation (NEW)
│   ├── README.md              # Documentation index
│   ├── API_INTEGRATION.md     # API integration guide
│   ├── BACKEND_API.md         # Backend API reference
│   ├── README_RBAC.md         # RBAC quick start guide
│   ├── RBAC_QUERYSET_GUIDE.md # Complete RBAC usage guide
│   ├── RBAC_SECURITY.md       # RBAC security overview
│   ├── RBAC_IMPLEMENTATION_SUMMARY.md  # RBAC implementation details
│   └── SEED_DATA.md           # Seed data documentation
│
├── seed/                      # 🌱 Database seed scripts (NEW)
│   ├── README.md              # Seed scripts documentation
│   ├── seed_classifications.py # Seed MTC/BSIC/TargetPopulation
│   ├── seed_services.py       # Seed service directory data
│   └── seed_audit_logs.py     # Seed audit logs
│
├── media/                     # User-uploaded files
│   └── avatars/               # User avatar images
│
├── statics/                   # Static files
│   ├── css/                   # Stylesheets
│   ├── js/                    # JavaScript files
│   └── images/                # Static images
│
├── .venv/                     # Python virtual environment
├── db.sqlite3                 # SQLite database (development)
├── manage.py                  # Django management script
├── pyproject.toml             # Python project configuration
└── README.md                  # Main backend README
```

## Recent Changes

### ✅ Completed: Folder Reorganization (Jan 2, 2025)

**What was done:**
1. Created `docs/` directory for all documentation
2. Created `seed/` directory for database seed scripts
3. Moved 7 documentation files to `docs/`
4. Moved 3 seed scripts to `seed/`
5. Created README.md in both new directories
6. Updated CLAUDE.md with new structure

**Files Moved to docs/:**
- API_INTEGRATION.md
- BACKEND_API.md
- RBAC_IMPLEMENTATION_SUMMARY.md
- RBAC_QUERYSET_GUIDE.md
- RBAC_SECURITY.md
- README_RBAC.md
- SEED_DATA.md

**Files Moved to seed/:**
- seed_audit_logs.py
- seed_classifications.py
- seed_services.py

## Navigation

### For Documentation

All documentation is now in the `docs/` directory:

```bash
cd backend/docs
ls -la
```

- **Start with:** [docs/README.md](docs/README.md)
- **RBAC Quick Start:** [docs/README_RBAC.md](docs/README_RBAC.md)
- **API Integration:** [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)

### For Seed Scripts

All seed scripts are now in the `seed/` directory:

```bash
cd backend
python seed/seed_classifications.py
python seed/seed_services.py
python seed/seed_audit_logs.py
```

- **Usage Guide:** [seed/README.md](seed/README.md)
- **Seed Data Details:** [docs/SEED_DATA.md](docs/SEED_DATA.md)

## Benefits of New Structure

### 1. Better Organization
- ✅ Clear separation of documentation and code
- ✅ Seed scripts grouped together
- ✅ Easier to find specific files
- ✅ Less clutter in root directory

### 2. Improved Maintainability
- ✅ Documentation in one place
- ✅ Seed scripts in one place
- ✅ Easier to add new files
- ✅ Clearer project structure

### 3. Better Developer Experience
- ✅ Quick access to documentation
- ✅ Easy to run seed scripts
- ✅ Clear README files in each folder
- ✅ Documented in CLAUDE.md

## File Counts

| Directory | Files | Purpose |
|-----------|-------|---------|
| `docs/` | 8 files | All project documentation |
| `seed/` | 4 files | Database seed scripts + README |
| `apps/` | 6 apps | Django applications |
| `core/` | 5 files | Django project settings |

## Quick Commands

### Documentation

```bash
# View documentation index
cat backend/docs/README.md

# View RBAC quick start
cat backend/docs/README_RBAC.md

# View all documentation
ls backend/docs/
```

### Seed Scripts

```bash
# View seed scripts README
cat backend/seed/README.md

# Run seed scripts
cd backend
python seed/seed_classifications.py
python seed/seed_services.py
python seed/seed_audit_logs.py
```

### Development

```bash
# Run development server
cd backend
python manage.py runserver

# Run tests
python manage.py test

# Run RBAC tests
python manage.py test apps.accounts.tests_rbac apps.accounts.tests_mixins
```

## Migration Guide

### Old Paths → New Paths

**Documentation:**
```
backend/API_INTEGRATION.md          → backend/docs/API_INTEGRATION.md
backend/BACKEND_API.md              → backend/docs/BACKEND_API.md
backend/RBAC_SECURITY.md            → backend/docs/RBAC_SECURITY.md
backend/RBAC_QUERYSET_GUIDE.md      → backend/docs/RBAC_QUERYSET_GUIDE.md
backend/RBAC_IMPLEMENTATION_SUMMARY.md → backend/docs/RBAC_IMPLEMENTATION_SUMMARY.md
backend/README_RBAC.md              → backend/docs/README_RBAC.md
backend/SEED_DATA.md                → backend/docs/SEED_DATA.md
```

**Seed Scripts:**
```
backend/seed_audit_logs.py          → backend/seed/seed_audit_logs.py
backend/seed_classifications.py     → backend/seed/seed_classifications.py
backend/seed_services.py            → backend/seed/seed_services.py
```

### Updating Links

If you have links to the old paths, update them:

**Before:**
```markdown
[RBAC Guide](../backend/RBAC_SECURITY.md)
```

**After:**
```markdown
[RBAC Guide](../backend/docs/RBAC_SECURITY.md)
```

## References

- **Main Project Documentation:** [CLAUDE.md](../CLAUDE.md)
- **Documentation Index:** [docs/README.md](docs/README.md)
- **Seed Scripts Guide:** [seed/README.md](seed/README.md)

## Contributing

When adding new files:

### Documentation Files
- Place in `docs/` directory
- Update `docs/README.md`
- Add to CLAUDE.md if necessary

### Seed Scripts
- Place in `seed/` directory
- Follow existing script pattern
- Update `seed/README.md`
- Test from clean database

### Code Files
- Place in appropriate `apps/` directory
- Follow Django app structure
- Add tests
- Update documentation as needed
