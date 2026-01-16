# Frontend API Usage Guide

## Quick Start

All API requests in the frontend use `/api/*` paths, which are automatically proxied to the Django backend.

```typescript
// ✅ Correct - Uses proxy
await fetch('/api/accounts/users/');

// ❌ Incorrect - Direct backend call (causes CORS issues)
await fetch('http://127.0.0.1:8000/api/accounts/users/');
```

## Using the API Client

### Import

```typescript
import { apiClient } from '@/lib/api-client';
```

### GET Request

```typescript
// Get all users
const users = await apiClient.get('/accounts/users/');

// Get users with query parameters
const users = await apiClient.get('/accounts/users/', {
  role: 'SURVEYOR',
  is_active: true,
  limit: 10
});

// Get single user
const user = await apiClient.get('/accounts/users/123/');
```

### POST Request

```typescript
// Create new user
const newUser = await apiClient.post('/accounts/users/', {
  email: 'user@example.com',
  password: 'password123',
  role: 'VIEWER',
  first_name: 'John',
  last_name: 'Doe'
});

// Login
const { access, refresh } = await apiClient.post('/accounts/auth/login/', {
  email: 'user@example.com',
  password: 'password123'
});
```

### PUT Request

```typescript
// Update user (full update)
const updated = await apiClient.put('/accounts/users/123/', {
  email: 'newemail@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'SURVEYOR'
});
```

### PATCH Request

```typescript
// Partial update
const updated = await apiClient.patch('/accounts/users/123/', {
  first_name: 'Jane' // Only update first_name
});
```

### DELETE Request

```typescript
// Delete user
await apiClient.delete('/accounts/users/123/');
```

## Authentication

### Login

```typescript
import { apiClient } from '@/lib/api-client';

async function login(email: string, password: string) {
  try {
    const data = await apiClient.login(email, password);
    // Tokens are automatically saved to localStorage and cookies
    console.log('Login successful!');
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

### Logout

```typescript
async function logout() {
  await apiClient.logout();
  // Tokens are automatically cleared
  window.location.href = '/login';
}
```

### Check Authentication

```typescript
if (apiClient.isAuthenticated()) {
  console.log('User is logged in');
} else {
  console.log('User is not logged in');
}
```

### Get Access Token

```typescript
const token = apiClient.getAccessToken();
```

## Error Handling

### Try-Catch Pattern

```typescript
try {
  const users = await apiClient.get('/accounts/users/');
  console.log('Users:', users);
} catch (error) {
  if (error.status === 404) {
    console.error('Not found');
  } else if (error.status === 401) {
    console.error('Unauthorized - redirecting to login');
    // apiClient automatically handles this
  } else {
    console.error('Error:', error.message);
  }
}
```

### API Error Structure

```typescript
interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Example error
{
  message: 'Validation failed',
  status: 400,
  errors: {
    email: ['This field is required.'],
    password: ['Password is too short.']
  }
}
```

## With TanStack Query

### useQuery

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

function UsersList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/accounts/users/')
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.results.map(user => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  );
}
```

### useMutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

function CreateUserForm() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: (userData) => apiClient.post('/accounts/users/', userData),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createUser.mutate({
      email: 'newuser@example.com',
      password: 'password123',
      role: 'VIEWER'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Query with Parameters

```typescript
function FilteredUsers({ role, isActive }) {
  const { data } = useQuery({
    queryKey: ['users', role, isActive],
    queryFn: () => apiClient.get('/accounts/users/', {
      role,
      is_active: isActive
    })
  });

  return <UsersList users={data?.results || []} />;
}
```

## Common API Endpoints

### Authentication

```typescript
// Login
POST /api/accounts/auth/login/
Body: { email, password }

// Logout (handled by client)
apiClient.logout()

// Refresh token (automatic)
POST /api/accounts/auth/refresh/
Body: { refresh }
```

### Users

```typescript
// List users
GET /api/accounts/users/

// Get user
GET /api/accounts/users/:id/

// Create user
POST /api/accounts/users/
Body: { email, password, role, first_name, last_name }

// Update user
PUT /api/accounts/users/:id/
PATCH /api/accounts/users/:id/

// Delete user
DELETE /api/accounts/users/:id/

// Current user
GET /api/accounts/users/me/
```

### Surveys

```typescript
// List surveys
GET /api/survey/surveys/

// Create survey
POST /api/survey/surveys/
Body: { service, survey_date, ... }

// Submit survey
POST /api/survey/surveys/:id/submit/

// Verify survey
POST /api/survey/surveys/:id/verify/
Body: { status, verifier_notes }
```

### Directory

```typescript
// List services
GET /api/directory/services/

// Get service
GET /api/directory/services/:id/

// List MTC
GET /api/directory/mtc/

// List BSIC
GET /api/directory/bsic/
```

## Tips & Best Practices

### 1. Always Use Proxy

```typescript
// ✅ Good
const data = await apiClient.get('/accounts/users/');

// ❌ Bad - causes CORS issues
const data = await fetch('http://127.0.0.1:8000/api/accounts/users/');
```

### 2. Handle Loading States

```typescript
function MyComponent() {
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const data = await apiClient.get('/accounts/users/');
      // Handle data
    } finally {
      setLoading(false);
    }
  }

  return loading ? <Spinner /> : <Data />;
}
```

### 3. Use TanStack Query

```typescript
// ✅ Better - automatic loading, caching, refetching
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => apiClient.get('/accounts/users/')
});

// ❌ Less optimal - manual state management
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  apiClient.get('/accounts/users/').then(setData);
}, []);
```

### 4. Invalidate Queries After Mutations

```typescript
const createUser = useMutation({
  mutationFn: (data) => apiClient.post('/accounts/users/', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }
});
```

### 5. Type Your API Responses

```typescript
interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'SURVEYOR' | 'VERIFIER' | 'VIEWER';
  first_name: string;
  last_name: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const users = await apiClient.get<PaginatedResponse<User>>('/accounts/users/');
```

## Troubleshooting

### 404 Not Found

**Problem:** API endpoint returns 404

**Solutions:**
- Check endpoint path is correct
- Ensure Django backend is running
- Verify URL doesn't have typos

### 401 Unauthorized

**Problem:** API returns 401

**Solutions:**
- User not logged in - redirect to login
- Token expired - apiClient handles refresh automatically
- Check cookies/localStorage for tokens

### CORS Error

**Problem:** CORS error in console

**Solutions:**
- Use `/api/*` not full backend URL
- Ensure middleware is configured correctly
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

### Network Error

**Problem:** Network request failed

**Solutions:**
- Check Django backend is running
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check network connectivity

## Related Documentation

- [PROXY_MIDDLEWARE.md](PROXY_MIDDLEWARE.md) - Proxy implementation details
- [lib/api-client.ts](lib/api-client.ts) - API client source code
- [proxy.ts](proxy.ts) - Proxy source code

## Summary

✅ **Use `/api/*` paths** - automatically proxied to Django
✅ **Use `apiClient`** - handles auth, errors, token refresh
✅ **Use TanStack Query** - automatic caching, loading states
✅ **Handle errors** - try-catch or React Query error states
✅ **Type responses** - use TypeScript interfaces

That's it! The proxy middleware and API client handle all the complexity for you.
