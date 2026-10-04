import Link from 'next/link';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { PublicationCard } from '@/components/publication-card';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { REFERENCES, sortedPublications } from '@/lib/publications';
import { HugeiconsIcon } from '@hugeicons/react';
import { LinkSquare02Icon } from '@hugeicons/core-free-icons';

export const metadata = {
  title: 'Publikasi — OMMHA',
  description:
    'Siaran pers, laporan penelitian, dan referensi dari penelitian One Map for Mental Health Atlas (OMMHA) di Kabupaten Kebumen.',
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
            Siaran pers dan laporan perkembangan penelitian OMMHA, serta referensi tentang
            pemetaan layanan kesehatan jiwa dan DESDE-LTC.
          </p>
        </div>

        <div className="border-t" />

        <section aria-labelledby="publikasi-ommha" className="pt-12">
          <h2 id="publikasi-ommha" className="text-lg font-medium mb-6">
            Dari penelitian OMMHA
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publications.map((publication) => (
              <PublicationCard key={publication.slug} publication={publication} />
            ))}
          </div>
        </section>

        <section aria-labelledby="referensi" className="pt-16">
          <h2 id="referensi" className="text-lg font-medium mb-2">
            Referensi
          </h2>
          <p className="text-[15px] text-muted-foreground mb-6 max-w-[62ch]">
            Bacaan dari luar OMMHA. Tautan dibuka di situs penerbitnya.
          </p>
          <ul className="divide-y border-y">
            {REFERENCES.map((reference) => (
              <li key={reference.title} className="py-5">
                <p className="text-xs text-muted-foreground mb-1.5">
                  {reference.type} · {reference.year} · {reference.publisher}
                </p>
                <Link
                  href={reference.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 text-base font-medium leading-snug hover:underline underline-offset-4"
                >
                  {reference.title}
                  <HugeiconsIcon icon={LinkSquare02Icon} size={14} className="mt-1 flex-shrink-0 text-muted-foreground" />
                  <span className="sr-only">(membuka situs lain)</span>
                </Link>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-[75ch]">
                  {reference.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
