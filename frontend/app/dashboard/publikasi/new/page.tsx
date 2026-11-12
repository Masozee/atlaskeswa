'use client';

import { PageHeader } from '@/components/page-header';
import { PublicationForm } from '@/components/publications/publication-form';

export default function NewPublicationPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Publikasi', href: '/dashboard/publikasi' },
          { label: 'Baru' },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold">Publikasi baru</h1>
          <p className="text-muted-foreground">Simpan sebagai draf dulu, lalu ubah status ke Terbit saat siap tampil.</p>
        </div>
        <PublicationForm />
      </div>
    </>
  );
}
