'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCurrentUser } from '@/hooks/use-auth';
import { Toaster } from 'sonner';

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuth();
  const { data: user, isLoading } = useCurrentUser();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
    setIsChecking(false);
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking && !isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/survey/new');
    }
  }, [isAuthenticated, isLoading, isChecking, router]);

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-muted animate-spin border-t-primary" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {children}
      <Toaster />
    </div>
  );
}
