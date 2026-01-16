# Backend Documentation

This directory contains all backend-related documentation for the Yakkum project.

## Documentation Files

### API Documentation

- **[API_INTEGRATION.md](API_INTEGRATION.md)** - Guide for integrating with the Yakkum API
- **[BACKEND_API.md](BACKEND_API.md)** - Complete backend API reference

### RBAC (Role-Based Access Control)

- **[README_RBAC.md](README_RBAC.md)** - ⭐ **Start Here** - Quick reference guide for RBAC
- **[RBAC_QUERYSET_GUIDE.md](RBAC_QUERYSET_GUIDE.md)** - Complete guide to using RBAC mixins
- **[RBAC_SECURITY.md](RBAC_SECURITY.md)** - Security implementation overview
- **[RBAC_IMPLEMENTATION_SUMMARY.md](RBAC_IMPLEMENTATION_SUMMARY.md)** - Implementation details and statistics

### Database

- **[SEED_DATA.md](SEED_DATA.md)** - Database seed data documentation

## Quick Links

### For Developers

- **Setting up RBAC in a ViewSet?** → [README_RBAC.md](README_RBAC.md)
- **Understanding RBAC security layers?** → [RBAC_SECURITY.md](RBAC_SECURITY.md)
- **Need detailed RBAC examples?** → [RBAC_QUERYSET_GUIDE.md](RBAC_QUERYSET_GUIDE.md)
- **Integrating with the API?** → [API_INTEGRATION.md](API_INTEGRATION.md)
- **Seeding database data?** → [SEED_DATA.md](SEED_DATA.md)

### For Code Review

- **Understanding the RBAC implementation?** → [RBAC_IMPLEMENTATION_SUMMARY.md](RBAC_IMPLEMENTATION_SUMMARY.md)

## File Organization

```
docs/
├── README.md                          # This file
├── API_INTEGRATION.md                 # API integration guide
├── BACKEND_API.md                     # API reference
├── README_RBAC.md                     # RBAC quick start
├── RBAC_QUERYSET_GUIDE.md            # RBAC detailed guide
├── RBAC_SECURITY.md                   # RBAC security overview
├── RBAC_IMPLEMENTATION_SUMMARY.md     # RBAC implementation details
└── SEED_DATA.md                       # Seed data documentation
```

## Contributing

When adding new documentation:

1. Place the file in this `docs/` directory
2. Update this README with a link to the new file
3. Add appropriate section headers
4. Include the file in the Quick Links if relevant
5. Update the main project [CLAUDE.md](../../CLAUDE.md) if necessary
