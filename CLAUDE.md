# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yakkum is a full-stack web application with a Django backend and Next.js frontend. The project follows a monorepo structure with separate directories for backend and frontend.

## Repository Structure

```
yakkum/
├── backend/          # Django REST API
│   ├── core/         # Django project settings and config
│   ├── apps/         # Django applications
│   │   ├── accounts/     # User authentication and management
│   │   ├── analytics/    # Analytics and tracking
│   │   ├── directory/    # Directory functionality
│   │   ├── survey/       # Survey features
│   │   ├── logs/         # Activity and audit logs
│   │   └── help/         # Help articles and support
│   ├── docs/         # Documentation files
│   ├── seed/         # Database seed scripts
│   ├── media/        # User-uploaded files
│   └── statics/      # Static files (CSS, JS, images)
├── frontend/         # Next.js application
│   ├── app/          # Next.js App Router pages
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and configs
│   ├── providers/    # React context providers
│   └── store/        # TanStack Store state management
└── mobile/           # React Native mobile app (Expo)
    ├── app/          # Mobile app screens
    ├── components/   # Mobile components
    └── services/     # API services
```

## Development Commands

### Backend (Django)

Navigate to the backend directory first: `cd backend`

**Package Management:**
- Install dependencies: `uv sync`
- Add new package: `uv add <package-name>`
- Remove package: `uv remove <package-name>`

**Development:**
- Run development server: `python manage.py runserver`
- Create migrations: `python manage.py makemigrations`
- Apply migrations: `python manage.py migrate`
- Create superuser: `python manage.py createsuperuser`
- Open Django shell: `python manage.py shell`
- Collect static files: `python manage.py collectstatic`

**App Management:**
- Create new app: `python manage.py startapp <app_name> apps/<app_name>`
- After creating an app, add it to `INSTALLED_APPS` in `core/settings.py`

**Testing:**
- Run all tests: `python manage.py test`
- Run specific app tests: `python manage.py test apps.<app_name>`
- Run with verbosity: `python manage.py test --verbosity=2`
- Run RBAC tests: `python manage.py test apps.accounts.tests_rbac apps.accounts.tests_mixins`

**Seed Data:**
- Run seed scripts: `python seed/<script_name>.py`
- Seed classifications: `python seed/seed_classifications.py`
- Seed services: `python seed/seed_services.py`
- Seed audit logs: `python seed/seed_audit_logs.py`

### Frontend (Next.js)

Navigate to the frontend directory first: `cd frontend`

**Package Management:**
- Install dependencies: `npm install`
- Add new package: `npm install <package-name>`
- Remove package: `npm uninstall <package-name>`

**Development:**
- Run development server: `npm run dev` (runs on http://localhost:3000)
- Build for production: `npm run build`
- Start production server: `npm start`
- Run linter: `npm run lint`

**API Configuration:**
- API requests use `/api/*` paths which are proxied to Django backend
- Configure backend URL in `.env.local`: `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api`
- Proxy automatically adds authentication headers
- See [frontend/PROXY_MIDDLEWARE.md](frontend/PROXY_MIDDLEWARE.md) for details

## Architecture Notes

### Backend Architecture

**Django Project Structure:**
- `core/` contains the main Django settings (`settings.py`), URL routing (`urls.py`), and WSGI/ASGI configs
- `apps/` directory uses a modular app structure with six main apps:
  - `accounts`: User authentication, profiles, permissions, RBAC
  - `analytics`: Data tracking and analytics features
  - `directory`: Directory/listing functionality (Services, MTC, BSIC)
  - `survey`: Survey creation and response handling with verification workflow
  - `logs`: Activity logs, audit logs, error logs, change logs
  - `help`: Help articles, FAQs, support tickets
- `docs/` directory contains all project documentation:
  - `API_INTEGRATION.md`: API integration guide
  - `BACKEND_API.md`: Backend API documentation
  - `RBAC_SECURITY.md`: RBAC security implementation guide
  - `RBAC_QUERYSET_GUIDE.md`: RBAC queryset filtering guide
  - `RBAC_IMPLEMENTATION_SUMMARY.md`: RBAC implementation summary
  - `README_RBAC.md`: RBAC quick reference
  - `SEED_DATA.md`: Seed data documentation
- `seed/` directory contains database seed scripts:
  - `seed_audit_logs.py`: Seed audit logs
  - `seed_classifications.py`: Seed MTC/BSIC/TargetPopulation
  - `seed_services.py`: Seed service directory data
- Each Django app follows standard structure: `models.py`, `views.py`, `admin.py`, `tests.py`, `migrations/`
- Database: SQLite (development) - configured in `core/settings.py`
- Static files served from `statics/`, media files from `media/`

**Adding New Django Apps:**
1. Create app in apps directory: `python manage.py startapp <name> apps/<name>`
2. Update the app's `apps.py` to use the full dotted path: `name = 'apps.<name>'`
3. Add `'apps.<name>'` to `INSTALLED_APPS` in `core/settings.py`

### Frontend Architecture

**Next.js 16 with App Router:**
- Uses App Router (not Pages Router) - all routes defined in `app/` directory
- TypeScript-first with strict type checking
- Tailwind CSS v4 for styling
- Font optimization with Geist Sans and Geist Mono

**State Management & Data Fetching:**
- **TanStack Query** (`@tanstack/react-query`): Server state management and data fetching
  - Query client configured in `lib/query-client.ts`
  - QueryProvider wraps the app in `app/layout.tsx`
  - Use for API calls, caching, background refetching
- **TanStack Store** (`@tanstack/react-store`): Client-side state management
  - Create stores in `store/` directory
  - Use custom hooks in `hooks/` for accessing store state
- **TanStack Table** (`@tanstack/react-table`): Headless table utilities for complex data tables

**Key Patterns:**
- Server components by default (no 'use client' directive needed)
- Add 'use client' only when using hooks, event handlers, or browser APIs
- Custom hooks in `hooks/` directory for reusable logic
- Shared providers in `providers/` directory
- Path aliases: `@/*` maps to project root (configured in `tsconfig.json`)

**API Proxy:**
- Next.js proxy handles `/api/*` requests to Django backend
- Located at: [frontend/proxy.ts](frontend/proxy.ts)
- Benefits: No CORS issues, automatic auth headers, simpler client code
- Configuration: `NEXT_PUBLIC_API_URL` environment variable
- Documentation: [frontend/PROXY_MIDDLEWARE.md](frontend/PROXY_MIDDLEWARE.md)

**Request Flow:**
```
Frontend (/api/users) → Next.js Proxy → Django (http://127.0.0.1:8000/api/users)
                        (adds auth headers)
```

**Icons:**
- **Hugeicons** (`hugeicons-react`): Default icon library for the project
  - Use Hugeicons for all new icons and UI elements
  - Import icons from `hugeicons-react` package
  - Example: `import { Tick01Icon, Cancel01Icon } from "hugeicons-react"`

## Python Environment

- Python version: 3.14+ (specified in `.python-version`)
- Package manager: `uv` (modern Python package manager)
- Virtual environment located at `backend/.venv/`
- To activate venv: `source backend/.venv/bin/activate` (Unix) or `backend\.venv\Scripts\activate` (Windows)

## Important Configuration Files

- `backend/core/settings.py`: Django settings (database, apps, middleware)
- `frontend/tsconfig.json`: TypeScript configuration with path aliases
- `frontend/next.config.ts`: Next.js configuration
- `frontend/tailwind.config.ts`: Tailwind CSS v4 configuration (if exists)
- `backend/pyproject.toml`: Python project metadata and dependencies

## Notes for Development

- Backend runs on default Django port (8000), frontend on port 3000
- Django apps are namespaced under `apps/` directory - always use full import paths
- Frontend uses React 19 and Next.js 16 - leverage server components where possible
- TanStack libraries are configured and ready to use for queries, tables, and state management

## UI/UX Standards

### Table Design Standard

**Reference Implementation:** `/frontend/app/dashboard/queue/page.tsx` (Verification Queue)

All data tables in the application should follow this design standard:

**Layout Structure:**
```tsx
<div className="flex flex-1 flex-col gap-4 p-4">
  {/* Page Header */}
  <div>
    <h1 className="text-2xl font-bold">Page Title</h1>
    <p className="text-muted-foreground">Page description</p>
  </div>

  {/* Search and Filters */}
  <div className="flex gap-2 justify-between items-center">
    {/* Search on the left */}
    <Input
      placeholder="Search..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-64"
    />

    {/* Filters on the right */}
    <div className="flex gap-2">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-40 !h-9">
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          {/* Filter options */}
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* Table */}
  <div className="rounded-lg border">
    <Table>
      <TableHeader>
        {/* Table headers */}
      </TableHeader>
      <TableBody>
        {/* Table rows */}
      </TableBody>
    </Table>
  </div>

  {/* Pagination/Results count */}
  <div className="flex items-center justify-between">
    <p className="text-sm text-muted-foreground">
      Showing {data.results.length} of {data.count} items
    </p>
  </div>
</div>
```

**Key Design Rules:**

1. **Layout:**
   - Use `flex flex-1 flex-col gap-4 p-4` for main container
   - All elements (title, filters, table, pagination) should be direct children, NOT wrapped in cards
   - Consistent 4-unit gap between sections

2. **Search & Filters:**
   - Search input on the LEFT with `w-64` width
   - Filters on the RIGHT, grouped with `flex gap-2`
   - Use `justify-between items-center` to separate left/right
   - Filter dropdowns should be `w-40` width
   - Both search and filters MUST have equal height (`!h-9` for selects to match input default)

3. **Table Container:**
   - Wrap table with `<div className="rounded-lg border">`
   - Do NOT use Card component for tables

4. **Components:**
   - Use **TanStack Table** for all data tables
   - Include sorting, filtering, and pagination support
   - Use shadcn/ui Table components (`Table`, `TableHeader`, `TableBody`, `TableCell`, `TableRow`)

5. **Actions Column:**
   - Use `DropdownMenu` with `MoreHorizontal` icon (3 dots)
   - Actions: View details, Edit, Delete, and context-specific actions

6. **Status/Role Badges:**
   - Use shadcn `Badge` component with appropriate variants
   - Common variants: `default`, `secondary`, `destructive`, `outline`

7. **Filter Size Consistency:**
   - Input has default height `h-9`
   - SelectTrigger needs `!h-9` to match (use `!` to override)
   - All filter elements must have the same visual height

**Example Badge Usage:**
```tsx
<Badge variant={
  status === 'ACTIVE' ? 'default' :
  status === 'PENDING' ? 'secondary' :
  status === 'REJECTED' ? 'destructive' :
  'outline'
}>
  {status}
</Badge>
```

### Sidebar Active Menu Color

- Active menu items (both main and submenu) use background color: `#4DA1DB`
- Active menu text color: `white`
- Applied automatically via `data-[active=true]` state in `SidebarMenuButton`

## RBAC (Role-Based Access Control)

The backend implements a comprehensive RBAC system with three security layers:

### User Roles

1. **ADMIN**: Full access to all data and functionality
2. **SURVEYOR**: Create and manage own surveys, create services
3. **VERIFIER**: Verify surveys, view audit logs
4. **VIEWER**: Read-only access to verified data

### Security Layers

1. **Middleware** ([apps/accounts/middleware.py](backend/apps/accounts/middleware.py))
   - URL pattern-based role validation
   - HTTP method-specific permissions
   - Early request rejection for unauthorized access

2. **Permission Classes** ([apps/accounts/permissions.py](backend/apps/accounts/permissions.py))
   - View-level permissions (IsAdmin, IsSurveyor, IsVerifier, IsViewer)
   - Object-level permissions (CanAccessUserData, CanAccessServiceData, etc.)
   - Action-specific permissions (CanModifySurveyStatus)

3. **QuerySet Filtering Mixins** ([apps/accounts/mixins.py](backend/apps/accounts/mixins.py))
   - Automatic data isolation by role
   - Reusable mixins for common patterns
   - Declarative configuration

### Using RBAC Mixins in ViewSets

**For Survey workflows:**
```python
from apps.accounts.mixins import SurveyorFilterMixin

class SurveyViewSet(SurveyorFilterMixin, viewsets.ModelViewSet):
    rbac_surveyor_field = 'surveyor'
    rbac_verifier_field = 'assigned_verifier'
    rbac_status_field = 'verification_status'
```

**For active/inactive filtering:**
```python
from apps.accounts.mixins import StatusBasedFilterMixin

class ServiceViewSet(StatusBasedFilterMixin, viewsets.ModelViewSet):
    rbac_status_field = 'is_active'
    rbac_admin_sees_inactive = True
```

**For activity logs:**
```python
from apps.accounts.mixins import UserActivityFilterMixin

class ActivityLogViewSet(UserActivityFilterMixin, viewsets.ReadOnlyModelViewSet):
    rbac_user_field = 'user'
    rbac_admin_sees_all = True
    rbac_verifier_sees_all = True
```

### Available Mixins

- **RBACQuerySetMixin**: Base mixin with custom Q object support
- **OwnershipFilterMixin**: For models with `created_by` field
- **SurveyorFilterMixin**: For survey verification workflows
- **UserActivityFilterMixin**: For activity/audit logs
- **StatusBasedFilterMixin**: For `is_active`/status fields
- **CombinedRBACMixin**: Combine multiple strategies

### RBAC Documentation

- **Quick Start**: [backend/docs/README_RBAC.md](backend/docs/README_RBAC.md)
- **Complete Guide**: [backend/docs/RBAC_QUERYSET_GUIDE.md](backend/docs/RBAC_QUERYSET_GUIDE.md)
- **Security Implementation**: [backend/docs/RBAC_SECURITY.md](backend/docs/RBAC_SECURITY.md)
- **Implementation Summary**: [backend/docs/RBAC_IMPLEMENTATION_SUMMARY.md](backend/docs/RBAC_IMPLEMENTATION_SUMMARY.md)

### RBAC Best Practices

1. **Always use mixins** for new ViewSets - eliminates code duplication
2. **Combine with permissions** - mixins filter data, permissions control actions
3. **Test each role** - ensure filtering works correctly for all roles
4. **Document behavior** - add docstrings explaining what each role can access
5. **Use select_related/prefetch_related** - optimize queries for performance
