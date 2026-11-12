'use client';

import { use } from 'react';
import { PageHeader } from '@/components/page-header';
import { PublicationForm } from '@/components/publications/publication-form';
import { usePublication } from '@/hooks/use-publications';

export default function EditPublicationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data, isLoading, isError } = usePublication(slug);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Publikasi', href: '/dashboard/publikasi' },
          { label: data?.title ?? 'Edit' },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold">Edit publikasi</h1>
          <p className="text-muted-foreground">Perubahan langsung tampil di halaman publik setelah disimpan.</p>
        </div>
        {isLoading && <p className="text-muted-foreground">Memuat…</p>}
        {isError && <p className="text-destructive">Publikasi tidak ditemukan atau Anda tidak punya akses.</p>}
        {/* Keyed by row so a slug rename re-seeds the form from the saved record. */}
        {data && <PublicationForm key={data.id} record={data} />}
      </div>
    </>
  );
}
