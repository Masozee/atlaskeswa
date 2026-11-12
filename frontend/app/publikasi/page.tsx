import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { PublicationCard } from '@/components/publication-card';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { fetchPublications } from '@/lib/publications';

// Content comes from the CMS; render per request so edits show at once.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Publikasi — OMMHA',
  description:
    'Arsip, laporan penelitian, serta siaran pers terkait kegiatan dan perkembangan Penelitian One Map for Mental Health Atlas (OMMHA).',
};

export default async function PublikasiPage() {
  const publications = await fetchPublications();

  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />
      <PublicNav />

      <main className={`${PUBLIC_CONTAINER} pb-24`}>
        <div className="pt-10 pb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08]">
            Publikasi
          </h1>
          <p className="mt-4 text-[15px] text-foreground/80 max-w-[62ch]">
            Halaman ini memuat berbagai arsip, laporan penelitian, serta siaran pers terkait
            kegiatan dan perkembangan Penelitian OMMHA.
          </p>
        </div>

        <div className="border-t" />

        {publications.length > 0 ? (
          <div className="grid gap-6 pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {publications.map((publication) => (
              <PublicationCard key={publication.slug} publication={publication} />
            ))}
          </div>
        ) : (
          <p className="pt-12 text-[15px] text-muted-foreground">Belum ada publikasi.</p>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
