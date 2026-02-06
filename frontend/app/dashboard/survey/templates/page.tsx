'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SurveyTemplatesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the single template detail page
    router.replace('/dashboard/survey/templates/1');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
