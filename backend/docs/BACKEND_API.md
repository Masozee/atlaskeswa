# Backend API Implementation Guide

## Quick Start

All serializers have been created. Now you need to:

1. **Create ViewSets** for each app
2. **Set up URL routing**
3. **Configure JWT authentication**
4. **Test endpoints**

## File Structure Needed

```
backend/
├── apps/
│   ├── accounts/
│   │   ├── serializers.py ✅ (Created)
│   │   ├── permissions.py ✅ (Created)
│   │   ├── views.py (Create ViewSets)
│   │   └── urls.py (Create URL routing)
│   ├── directory/
│   │   ├── serializers.py ✅ (Created)
│   │   ├── views.py (Create ViewSets)
│   │   └── urls.py (Create URL routing)
│   ├── survey/
│   │   ├── serializers.py ✅ (Created)
│   │   ├── views.py (Create ViewSets)
│   │   └── urls.py (Create URL routing)
│   └── logs/
│       ├── serializers.py ✅ (Created)
│       ├── views.py (Create ViewSets)
│       └── urls.py (Create URL routing)
└── core/
    └── urls.py (Main URL configuration)
```

## API Endpoints Structure

### Authentication
- POST `/api/v1/auth/login/` - Login (get JWT tokens)
- POST `/api/v1/auth/refresh/` - Refresh access token
- POST `/api/v1/auth/logout/` - Logout

### Users
- GET/POST `/api/v1/users/` - List/Create users
- GET/PUT/PATCH/DELETE `/api/v1/users/{id}/` - User detail
- GET `/api/v1/users/me/` - Current user
- PUT/PATCH `/api/v1/users/profile/` - Update profile
- POST `/api/v1/users/change-password/` - Change password
- GET `/api/v1/users/stats/` - User statistics

### Directory (Services)
- GET/POST `/api/v1/services/` - List/Create services
- GET/PUT/PATCH/DELETE `/api/v1/services/{id}/` - Service detail
- GET `/api/v1/services/stats/` - Service statistics
- GET `/api/v1/mtc/` - MTC classifications
- GET `/api/v1/bsic/` - BSIC classifications
- GET `/api/v1/target-populations/` - Target populations
- GET `/api/v1/service-types/` - Service types

### Surveys
- GET/POST `/api/v1/surveys/` - List/Create surveys
- GET/PUT/PATCH/DELETE `/api/v1/surveys/{id}/` - Survey detail
- POST `/api/v1/surveys/{id}/submit/` - Submit survey
- POST `/api/v1/surveys/{id}/verify/` - Verify/Reject survey
- GET `/api/v1/surveys/stats/` - Survey statistics
- GET `/api/v1/surveys/{id}/attachments/` - Survey attachments
- GET `/api/v1/surveys/{id}/audit-logs/` - Survey audit trail

### Logs
- GET `/api/v1/logs/activity/` - Activity logs
- GET `/api/v1/logs/verification/` - Verification logs
- GET `/api/v1/logs/data-changes/` - Data change logs
- GET `/api/v1/logs/system-errors/` - System errors
- GET `/api/v1/logs/import-export/` - Import/export logs

### Dashboard
- GET `/api/v1/dashboard/stats/` - Dashboard statistics
- GET `/api/v1/dashboard/overview/` - Dashboard overview

## Frontend Integration with TanStack Query

### 1. Install Dependencies (Already done in frontend)
```bash
npm install @tanstack/react-query
```

### 2. API Configuration (`lib/api-client.ts`)
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

export const apiClient = {
  async get(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    })
    if (!response.ok) throw new Error('API Error')
    return response.json()
  },
  
  async post(endpoint: string, data?: any, options?: RequestInit) {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('API Error')
    return response.json()
  },
}
```

### 3. Query Hooks (`hooks/use-services.ts`)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useServices(params?: any) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => apiClient.get('/services/', { params }),
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => apiClient.get(`/services/${id}/`),
    enabled: !!id,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/services/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}
```

## Next Steps

1. Run: `python manage.py seed_data --clear` to populate database
2. Start server: `python manage.py runserver`
3. Test endpoints with tools like Postman or Thunder Client
4. Integrate frontend with TanStack Query hooks

