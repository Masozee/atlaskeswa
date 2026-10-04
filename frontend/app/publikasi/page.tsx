import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { PublicationCard } from '@/components/publication-card';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { sortedPublications } from '@/lib/publications';

export const metadata = {
  title: 'Publikasi — OMMHA',
  description:
    'Siaran pers dan laporan dari penelitian One Map for Mental Health Atlas (OMMHA) di Kabupaten Kebumen.',
};

export default function PublikasiPage() {
  const publications = sortedPublications();

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
            Siaran pers dan laporan perkembangan penelitian OMMHA tentang pemetaan layanan
            kesehatan jiwa di Kabupaten Kebumen.
          </p>
        </div>

        <div className="border-t" />

        <div className="grid gap-6 pt-12 sm:grid-cols-2 lg:grid-cols-3">
          {publications.map((publication) => (
            <PublicationCard key={publication.slug} publication={publication} />
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
