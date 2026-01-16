# YAKKUM API Integration Guide

## Overview

Complete Django REST API with TanStack Query frontend integration for the DESDE-LTC Mental Health Services Directory and Survey Management System.

## Backend API

### Base URL
```
http://127.0.0.1:8000/api
```

### Authentication

**JWT Token-Based Authentication**

#### Login
```http
POST /api/accounts/auth/login/
Content-Type: application/json

{
  "email": "admin@yakkum.id",
  "password": "admin123"
}

Response:
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

#### Refresh Token
```http
POST /api/accounts/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ..."
}

Response:
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

#### Using Tokens
```http
Authorization: Bearer eyJ...
```

### API Endpoints

#### **1. Accounts & Users**

| Endpoint | Method | Description | Permissions |
|----------|--------|-------------|-------------|
| `/api/accounts/users/` | GET | List all users | Authenticated |
| `/api/accounts/users/{id}/` | GET | Get user details | Authenticated |
| `/api/accounts/users/` | POST | Create user | Anyone |
| `/api/accounts/users/{id}/` | PATCH | Update user | Admin |
| `/api/accounts/users/me/` | GET | Get current user | Authenticated |
| `/api/accounts/users/profile/` | PATCH | Update profile | Authenticated |
| `/api/accounts/users/change_password/` | POST | Change password | Authenticated |
| `/api/accounts/users/stats/` | GET | User statistics | Admin |

#### **2. Directory (Services)**

| Endpoint | Method | Description | Permissions |
|----------|--------|-------------|-------------|
| `/api/directory/services/` | GET | List services | Authenticated |
| `/api/directory/services/{id}/` | GET | Get service details | Authenticated |
| `/api/directory/services/` | POST | Create service | Surveyor/Admin |
| `/api/directory/services/{id}/` | PATCH | Update service | Surveyor/Admin |
| `/api/directory/services/{id}/` | DELETE | Delete service | Surveyor/Admin |
| `/api/directory/services/stats/` | GET | Service statistics | Authenticated |
| `/api/directory/services/map/` | GET | Services with coordinates | Authenticated |
| `/api/directory/services/{id}/surveys/` | GET | Service surveys | Authenticated |
| `/api/directory/mtc/` | GET | List MTC codes | Authenticated |
| `/api/directory/mtc/tree/` | GET | MTC hierarchy | Authenticated |
| `/api/directory/bsic/` | GET | List BSIC codes | Authenticated |
| `/api/directory/target-populations/` | GET | Target populations | Authenticated |
| `/api/directory/service-types/` | GET | Service types | Authenticated |

#### **3. Surveys**

| Endpoint | Method | Description | Permissions |
|----------|--------|-------------|-------------|
| `/api/surveys/surveys/` | GET | List surveys | Authenticated (filtered by role) |
| `/api/surveys/surveys/{id}/` | GET | Get survey details | Authenticated |
| `/api/surveys/surveys/` | POST | Create survey | Surveyor/Admin |
| `/api/surveys/surveys/{id}/` | PATCH | Update survey | Surveyor/Admin (owner) |
| `/api/surveys/surveys/{id}/submit/` | POST | Submit for verification | Surveyor/Admin (owner) |
| `/api/surveys/surveys/{id}/verify/` | POST | Verify/reject survey | Verifier/Admin |
| `/api/surveys/surveys/{id}/attachments/` | GET | Survey attachments | Authenticated |
| `/api/surveys/surveys/{id}/audit_logs/` | GET | Survey audit logs | Authenticated |
| `/api/surveys/surveys/stats/` | GET | Survey statistics | Authenticated |

#### **4. Logs**

| Endpoint | Method | Description | Permissions |
|----------|--------|-------------|-------------|
| `/api/logs/activity/` | GET | Activity logs | Authenticated |
| `/api/logs/activity/stats/` | GET | Activity statistics | Authenticated |
| `/api/logs/verification/` | GET | Verification logs | Authenticated |
| `/api/logs/verification/stats/` | GET | Verification statistics | Authenticated |
| `/api/logs/data-changes/` | GET | Data change logs | Authenticated |
| `/api/logs/data-changes/stats/` | GET | Data change statistics | Authenticated |
| `/api/logs/errors/` | GET | System errors | Authenticated |
| `/api/logs/errors/stats/` | GET | Error statistics | Authenticated |
| `/api/logs/errors/{id}/resolve/` | POST | Resolve error | Admin |
| `/api/logs/import-export/` | GET | Import/export logs | Authenticated |
| `/api/logs/import-export/stats/` | GET | Import/export statistics | Authenticated |

#### **5. Analytics**

| Endpoint | Method | Description | Permissions |
|----------|--------|-------------|-------------|
| `/api/analytics/dashboard/` | GET | Dashboard statistics | Authenticated |
| `/api/analytics/services/` | GET | Service analytics | Authenticated |
| `/api/analytics/surveys/` | GET | Survey analytics | Authenticated |

### Query Parameters

All list endpoints support:
- **Pagination**: `?page=1&page_size=50`
- **Search**: `?search=keyword`
- **Ordering**: `?ordering=-created_at`
- **Filtering**: `?city=Jakarta&is_verified=true`

### Test Credentials

```
Admin:     admin@yakkum.id / admin123
Surveyor:  surveyor1@yakkum.id / surveyor123
Verifier:  verifier1@yakkum.id / verifier123
Viewer:    viewer1@yakkum.id / viewer123
```

## Frontend Integration

### Setup

The frontend uses **TanStack Query (React Query)** for server state management.

### API Client

Located at `frontend/lib/api-client.ts`:

```typescript
import { apiClient } from '@/lib/api-client';

// Login
await apiClient.login('admin@yakkum.id', 'admin123');

// Authenticated requests
const services = await apiClient.get('/directory/services/');
const service = await apiClient.post('/directory/services/', data);
```

### TanStack Query Hooks

#### Authentication
```typescript
import { useLogin, useLogout, useCurrentUser } from '@/hooks/use-auth';

// Login
const { mutate: login, isPending } = useLogin();
login({ email: 'admin@yakkum.id', password: 'admin123' });

// Current user
const { data: user } = useCurrentUser();

// Logout
const { mutate: logout } = useLogout();
logout();
```

#### Services
```typescript
import {
  useServices,
  useService,
  useCreateService,
  useUpdateService
} from '@/hooks/use-services';

// List services
const { data, isLoading } = useServices({ city: 'Jakarta' });

// Get single service
const { data: service } = useService(1);

// Create service
const { mutate: createService } = useCreateService();
createService(serviceData);

// Update service
const { mutate: updateService } = useUpdateService(1);
updateService(updatedData);
```

#### Surveys
```typescript
import {
  useSurveys,
  useSurvey,
  useSubmitSurvey,
  useVerifySurvey
} from '@/hooks/use-surveys';

// List surveys
const { data } = useSurveys({ verification_status: 'SUBMITTED' });

// Submit survey
const { mutate: submit } = useSubmitSurvey(surveyId);
submit({ assigned_verifier: 3 });

// Verify survey
const { mutate: verify } = useVerifySurvey(surveyId);
verify({ action: 'verify', notes: 'Approved' });
```

#### Analytics
```typescript
import { useDashboardStats } from '@/hooks/use-analytics';

// Dashboard statistics (auto-refreshes every minute)
const { data: stats } = useDashboardStats();
```

### Example: Dashboard Page

```typescript
'use client';

import { useDashboardStats } from '@/hooks/use-analytics';
import { useServices } from '@/hooks/use-services';
import { useSurveys } from '@/hooks/use-surveys';

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: services } = useServices({ page_size: 10 });
  const { data: surveys } = useSurveys({ verification_status: 'SUBMITTED' });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardTitle>Total Services</CardTitle>
          <CardValue>{stats?.services.total}</CardValue>
        </Card>

        <Card>
          <CardTitle>Verified Services</CardTitle>
          <CardValue>{stats?.services.verified}</CardValue>
        </Card>

        <Card>
          <CardTitle>Pending Surveys</CardTitle>
          <CardValue>{stats?.surveys.pending}</CardValue>
        </Card>

        <Card>
          <CardTitle>Total Users</CardTitle>
          <CardValue>{stats?.users.total}</CardValue>
        </Card>
      </div>

      <div className="mt-8">
        <h2>Recent Services</h2>
        {services?.results.map(service => (
          <div key={service.id}>{service.name}</div>
        ))}
      </div>

      <div className="mt-8">
        <h2>Pending Surveys</h2>
        {surveys?.results.map(survey => (
          <div key={survey.id}>{survey.service_name}</div>
        ))}
      </div>
    </div>
  );
}
```

## Architecture

### Backend Stack
- **Django 6.0** - Web framework
- **Django REST Framework** - API framework
- **djangorestframework-simplejwt** - JWT authentication
- **django-filter** - Advanced filtering
- **django-cors-headers** - CORS support

### Frontend Stack
- **Next.js 16** - React framework
- **TanStack Query** - Server state management
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling

### Database
- **SQLite** (development)
- **PostgreSQL-ready** (production)

## Features

✅ Complete REST API with 50+ endpoints
✅ JWT authentication with token refresh
✅ Role-based access control (ADMIN, SURVEYOR, VERIFIER, VIEWER)
✅ Pagination, filtering, searching, ordering
✅ Comprehensive logging system (5 log types)
✅ Survey verification workflow
✅ Real-time analytics and statistics
✅ TypeScript type safety
✅ Automatic query invalidation and cache management
✅ Optimistic updates
✅ Error handling with retry logic

## Development Commands

### Backend
```bash
cd backend

# Run server
uv run python manage.py runserver

# Create migrations
uv run python manage.py makemigrations

# Apply migrations
uv run python manage.py migrate

# Seed database
uv run python manage.py seed_data

# Run tests
uv run python manage.py test
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Next Steps

1. **Implement UI Components** - Create dashboard, services list, survey forms
2. **Add File Uploads** - Survey attachments and user avatars
3. **Implement Real-time Updates** - WebSockets for live notifications
4. **Add Export Features** - CSV/Excel export for reports
5. **Implement Search** - Advanced search with filters
6. **Add Charts** - Visualizations for analytics data
7. **Mobile Responsive** - Optimize for mobile devices
8. **Testing** - Unit tests, integration tests, E2E tests

## Support

For issues or questions:
- Check Django server logs
- Check browser console for frontend errors
- Verify JWT tokens are being sent correctly
- Ensure CORS is configured properly

---

**Status**: ✅ Backend API Complete | ✅ Frontend Integration Complete | 🚀 Ready for UI Development
