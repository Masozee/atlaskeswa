'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    const isAuth = checkAuth();

    // If not authenticated and not on login/signup page, redirect to login
    if (!isAuth && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router, checkAuth]);

  // If not authenticated and trying to access protected route, show loading
  if (!isAuthenticated && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
