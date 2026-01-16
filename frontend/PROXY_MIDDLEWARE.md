# Next.js API Proxy Proxy

## Overview

The frontend uses Next.js middleware to proxy API requests from the frontend (`/api/*`) to the Django backend. This provides several benefits:

- **CORS handling**: No CORS issues since requests go through Next.js
- **Automatic auth headers**: Proxy adds authentication tokens automatically
- **Simpler client code**: Use relative URLs instead of full backend URLs
- **Better development experience**: Single server for frontend and backend requests

## Architecture

```
┌─────────────┐        ┌──────────────┐        ┌─────────────────┐
│   Browser   │───────▶│   Next.js    │───────▶│ Django Backend  │
│             │        │  Proxy  │        │  (Port 8000)    │
│             │        │  (Proxy)     │        │                 │
└─────────────┘        └──────────────┘        └─────────────────┘
    Request to              Rewrites to              Actual API
    /api/accounts/          http://127.0.0.1:8000/   endpoint
    auth/login/             api/accounts/auth/login/
```

## Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Django Backend URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

For different environments:

**Development:**
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

**Staging:**
```env
NEXT_PUBLIC_API_URL=https://staging-api.yakkum.com/api
```

**Production:**
```env
NEXT_PUBLIC_API_URL=https://api.yakkum.com/api
```

### Proxy Configuration

The middleware is configured in [proxy.ts](proxy.ts):

```typescript
export function proxy(request: NextRequest) {
  // API Proxy
  if (pathname.startsWith('/api/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    const backendPath = pathname.replace(/^\/api/, '');
    const backendUrl = new URL(backendPath, apiUrl);

    // Forward with auth headers
    return NextResponse.rewrite(backendUrl, {
      request: { headers }
    });
  }
}
```

## Usage

### In Frontend Code

**Before (Direct backend calls):**
```typescript
const response = await fetch('http://127.0.0.1:8000/api/accounts/users/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**After (Using proxy):**
```typescript
const response = await fetch('/api/accounts/users/');
// Auth header added automatically by middleware
```

### With API Client

The API client automatically uses the proxy:

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const users = await apiClient.get('/accounts/users/');

// POST request
const newUser = await apiClient.post('/accounts/users/', {
  email: 'user@example.com',
  password: 'password123',
  role: 'VIEWER'
});

// All requests go through /api/* and are proxied to Django
```

## How It Works

### 1. Client Makes Request

Browser makes a request to `/api/accounts/users/`:

```javascript
fetch('/api/accounts/users/')
```

### 2. Proxy Intercepts

Next.js middleware catches the request before it reaches Next.js API routes:

```typescript
if (pathname.startsWith('/api/')) {
  // Proxy logic
}
```

### 3. Proxy Rewrites URL

Proxy rewrites the URL to point to Django backend:

```
/api/accounts/users/ → http://127.0.0.1:8000/api/accounts/users/
```

### 4. Proxy Adds Headers

Proxy adds authentication headers from cookies:

```typescript
const token = request.cookies.get('access_token')?.value;
if (token) {
  headers.set('Authorization', `Bearer ${token}`);
}
```

### 5. Request Forwarded

Request is forwarded to Django backend with:
- Original method (GET, POST, etc.)
- Original body
- Query parameters
- Authentication headers

### 6. Response Returned

Django response is returned to the client as-is.

## Benefits

### 1. **No CORS Issues**

Since requests go through Next.js, they're same-origin:

**Without proxy:**
```
Frontend: http://localhost:3000
Backend:  http://localhost:8000  ← CORS error!
```

**With proxy:**
```
Frontend: http://localhost:3000
Proxy:    http://localhost:3000/api  ← Same origin!
Backend:  http://localhost:8000      ← Proxied internally
```

### 2. **Automatic Authentication**

Proxy automatically adds auth tokens:

```typescript
// No need to manually add Authorization header
await fetch('/api/accounts/users/');
```

### 3. **Environment-Agnostic Code**

Same code works in all environments:

```typescript
// Works in dev, staging, and production
const users = await apiClient.get('/accounts/users/');
```

### 4. **Simpler Development**

- Single server to run (Next.js)
- No need to configure CORS in Django
- Easier debugging (all requests in one network tab)

### 5. **Better Security**

- Auth tokens in HttpOnly cookies (optional)
- No token exposure in client code
- Backend URL not exposed to client

## Request Flow Examples

### Example 1: Login Request

**Client code:**
```typescript
const response = await fetch('/api/accounts/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

**What happens:**
1. Request to `/api/accounts/auth/login/`
2. Proxy intercepts
3. Rewrites to `http://127.0.0.1:8000/api/accounts/auth/login/`
4. Forwards POST request with body
5. Django returns tokens
6. Tokens saved in cookies and localStorage
7. Response returned to client

### Example 2: Authenticated Request

**Client code:**
```typescript
const users = await fetch('/api/accounts/users/');
```

**What happens:**
1. Request to `/api/accounts/users/`
2. Proxy intercepts
3. Reads `access_token` from cookies
4. Adds `Authorization: Bearer <token>` header
5. Rewrites to `http://127.0.0.1:8000/api/accounts/users/`
6. Forwards GET request with auth header
7. Django validates token and returns users
8. Response returned to client

### Example 3: Query Parameters

**Client code:**
```typescript
const surveys = await fetch('/api/survey/surveys/?status=VERIFIED&limit=10');
```

**What happens:**
1. Request to `/api/survey/surveys/?status=VERIFIED&limit=10`
2. Proxy intercepts
3. Rewrites to `http://127.0.0.1:8000/api/survey/surveys/`
4. Copies query params: `?status=VERIFIED&limit=10`
5. Forwards GET request
6. Django returns filtered surveys
7. Response returned to client

## Debugging

### Enable Proxy Logging

Add console.log to middleware:

```typescript
export function proxy(request: NextRequest) {
  console.log('Proxy:', request.method, request.url);

  if (pathname.startsWith('/api/')) {
    const backendUrl = new URL(backendPath, apiUrl);
    console.log('Proxying to:', backendUrl.toString());
  }
}
```

### Check Network Tab

In browser DevTools:
1. Open Network tab
2. Make an API request
3. Look for request to `/api/*`
4. Check request headers (should have Authorization)
5. Check response

### Common Issues

**Issue: 404 Not Found**
- **Cause**: Backend not running or wrong URL
- **Fix**: Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Issue: 401 Unauthorized**
- **Cause**: Token missing or invalid
- **Fix**: Check cookies, login again

**Issue: CORS Error**
- **Cause**: Request not going through proxy
- **Fix**: Use `/api/*` not full backend URL

**Issue: Infinite Redirect**
- **Cause**: Proxy matcher catching `/api/*`
- **Fix**: Already handled in current config

## Testing

### Test Proxy Locally

1. **Start Django backend:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start Next.js frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test API request:**
   ```bash
   # Should return data from Django
   curl http://localhost:3000/api/accounts/users/
   ```

### Test with Different Backends

**Local Django:**
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

**Docker Django:**
```env
NEXT_PUBLIC_API_URL=http://host.docker.internal:8000/api
```

**Network Django (different machine):**
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

## Production Considerations

### 1. Use Environment Variables

Never hardcode backend URLs:

```typescript
// ❌ Bad
const API_URL = 'http://127.0.0.1:8000/api';

// ✅ Good
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

### 2. Enable HTTPS

In production, use HTTPS for backend:

```env
NEXT_PUBLIC_API_URL=https://api.yakkum.com/api
```

### 3. Set Proper CORS (Backend)

Even with proxy, configure CORS in Django for direct API access:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://yakkum.com",
    "https://www.yakkum.com",
]
```

### 4. Rate Limiting

Consider rate limiting at:
- Django backend level
- Next.js middleware level
- CDN/Load balancer level

### 5. Caching

Enable caching for static API responses:

```typescript
export function proxy(request: NextRequest) {
  if (pathname.startsWith('/api/directory/')) {
    // Cache directory data
    return NextResponse.rewrite(backendUrl, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600'
      }
    });
  }
}
```

## Migration Guide

### Migrating from Direct Backend Calls

**Before:**
```typescript
const API_URL = 'http://127.0.0.1:8000/api';

async function getUsers() {
  const response = await fetch(`${API_URL}/accounts/users/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

**After:**
```typescript
async function getUsers() {
  const response = await fetch('/api/accounts/users/');
  return response.json();
}
```

### Checklist

- [ ] Update `.env.local` with `NEXT_PUBLIC_API_URL`
- [ ] Change all API calls to use `/api/*` instead of full URL
- [ ] Remove manual Authorization headers (middleware adds them)
- [ ] Update API client configuration
- [ ] Test all API endpoints
- [ ] Update documentation

## Related Files

- [proxy.ts](proxy.ts) - Proxy implementation
- [lib/api-client.ts](lib/api-client.ts) - API client using proxy
- [.env.example](.env.example) - Environment variables example

## References

- [Next.js Proxy Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js Rewrites](https://nextjs.org/docs/app/api-reference/next-config-js/rewrites)
- [Django CORS Headers](https://github.com/adamchainz/django-cors-headers)

## Summary

The Next.js API proxy middleware:
- ✅ Proxies `/api/*` requests to Django backend
- ✅ Automatically adds authentication headers
- ✅ Eliminates CORS issues
- ✅ Simplifies client code
- ✅ Works in all environments (dev, staging, production)
- ✅ Maintains same-origin policy
- ✅ Improves security

Just use `/api/*` in your frontend code, and the middleware handles the rest!
