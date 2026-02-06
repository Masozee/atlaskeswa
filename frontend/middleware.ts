import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy
 * Handles authentication redirects and API proxying to Django backend
 */

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // ==========================================
  // API PROXY - Forward /api/* requests to Django backend
  // ==========================================
  if (pathname.startsWith('/api/')) {
    // Use environment variable, fallback to production API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
                   process.env.API_URL ||
                   'https://api.atlaskeswa.id';

    // Rewrite /api/ to /v1/ for Django backend
    let backendPath = pathname.replace(/^\/api\//, '/v1/');

    // Ensure trailing slash for Django (Django APPEND_SLASH setting)
    if (!backendPath.endsWith('/')) {
      backendPath += '/';
    }

    // Construct full backend URL
    const backendUrl = new URL(backendPath, apiUrl);

    console.log('[Proxy] Frontend path:', pathname);
    console.log('[Proxy] Backend path (with slash):', backendPath);
    console.log('[Proxy] Backend URL:', backendUrl.toString());

    // Copy query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    // Prepare headers for backend request
    const headers = new Headers();

    // Copy relevant headers from original request
    const headersToForward = [
      'content-type',
      'accept',
      'accept-language',
      'accept-encoding',
      'user-agent',
    ];

    headersToForward.forEach((header) => {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    // Add authorization header if token exists
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Forward the request to Django backend
    try {
      // Read the request body if it exists
      let body: string | undefined = undefined;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        body = await request.text();
        console.log('[Proxy] Request body:', body);
      }

      const response = await fetch(backendUrl.toString(), {
        method: request.method,
        headers,
        body,
      });

      console.log('[Proxy] Response status:', response.status);

      // Log error responses for debugging
      if (response.status >= 400) {
        const errorText = await response.clone().text();
        console.log('[Proxy] Error response:', errorText);
      }

      // Return the response from Django
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      console.error('[Proxy] Error:', error);
      return new Response(JSON.stringify({ error: 'Proxy error', details: String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ==========================================
  // AUTHENTICATION REDIRECTS
  // ==========================================

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If trying to access protected route without token, redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and trying to access login page, redirect to dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     *
     * Note: /api/* is now included to enable proxying
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
