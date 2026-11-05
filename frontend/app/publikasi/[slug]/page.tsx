import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { PublicationCard } from '@/components/publication-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { BlockView, Caption, headingId } from '@/components/article-blocks';
import {
  formatPublicationDate,
  getPublication,
  hostedPublications,
  sortedPublications,
  type Publication,
} from '@/lib/publications';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Download04Icon } from '@hugeicons/core-free-icons';

// Every publication is known at build time; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return hostedPublications().map((publication) => ({ slug: publication.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const publication = getPublication((await params).slug);
  if (!publication) return {};
  return {
    title: `${publication.title} — OMMHA`,
    description: publication.excerpt,
    openGraph: {
      title: publication.title,
      description: publication.excerpt,
      type: 'article',
      publishedTime: publication.date,
      images: [{ url: publication.cover.src, alt: publication.cover.alt }],
    },
  };
}

/* -------------------------------------------------------------------- side */

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[15px]">{children}</dd>
    </div>
  );
}

function Sidebar({ publication }: { publication: Publication }) {
  const headings = publication.body.filter((block) => block.type === 'h2');

  return (
    <aside className="space-y-8 lg:sticky lg:top-6">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-1">
        <Meta label="Jenis">{publication.type}</Meta>
        <Meta label="Tanggal">
          <time dateTime={publication.date}>{formatPublicationDate(publication.date)}</time>
        </Meta>
        <Meta label="Penulis">{publication.author}</Meta>
        {publication.period && <Meta label="Periode">{publication.period}</Meta>}
      </dl>

      {publication.file && (
        <Button asChild className="w-full gap-2">
          <a href={publication.file.href} download>
            <HugeiconsIcon icon={Download04Icon} size={16} />
            {publication.file.label}
            <span className="font-normal opacity-80">· {publication.file.size}</span>
          </a>
        </Button>
      )}

      {headings.length > 1 && (
        <nav aria-label="Daftar isi" className="hidden lg:block">
          <p className="text-[13px] text-muted-foreground mb-2">Daftar isi</p>
          <ol className="space-y-1.5 text-sm">
            {headings.map((heading) => (
              <li key={heading.text}>
                <a href={`#${headingId(heading.text)}`} className="hover:underline underline-offset-4">
                  {heading.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </aside>
  );
}

/* -------------------------------------------------------------------- page */

export default async function PublicationPage({ params }: { params: Promise<{ slug: string }> }) {
  const publication = getPublication((await params).slug);
  if (!publication) notFound();

  const others = sortedPublications().filter((item) => item.slug !== publication.slug);

  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />
      <PublicNav />

      <main className={`${PUBLIC_CONTAINER} pb-24`}>
        <header className="pt-8 pb-8">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="inline-block py-1 -my-1 hover:text-foreground transition-colors">
                  Beranda
                </Link>
              </li>
              <li aria-hidden className="opacity-50">/</li>
              <li>
                <Link href="/publikasi" className="inline-block py-1 -my-1 hover:text-foreground transition-colors">
                  Publikasi
                </Link>
              </li>
              <li aria-hidden className="opacity-50">/</li>
              <li className="text-foreground">{publication.type}</li>
            </ol>
          </nav>

          <Badge className="mt-5 border-0 bg-[#07579E] text-white">{publication.type}</Badge>
          <h1 className="mt-3 max-w-[28ch] text-[30px] sm:text-[40px] font-semibold tracking-tight leading-[1.1] text-balance">
            {publication.title}
          </h1>
          <p className="mt-4 max-w-[68ch] text-lg text-foreground/80 leading-relaxed">{publication.excerpt}</p>
        </header>

        <figure>
          <div className="relative aspect-[16/9] lg:aspect-[21/9] w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={publication.cover.src}
              alt={publication.cover.alt}
              fill
              priority
              sizes="(min-width: 1280px) 1248px, 100vw"
              className="object-cover"
            />
          </div>
          {publication.cover.credit && <Caption>{publication.cover.credit}</Caption>}
        </figure>

        <div className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <div className="lg:order-2">
            <Sidebar publication={publication} />
          </div>
          <article className="lg:order-1 max-w-[68ch] space-y-5 text-[16px] leading-[1.75] text-foreground/85">
            {publication.body.map((block, index) => (
              <BlockView key={index} block={block} />
            ))}

            {/* The page carries the opening only; the rest of the report lives
                in the original. */}
            {publication.file && (
              <div className="mt-8 flex flex-col gap-4 rounded-lg border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[15px] leading-snug text-foreground">
                  Hasil pemetaan dan rencana tindak lanjut selengkapnya ada di laporan lengkap.
                </p>
                <Button asChild variant="outline" className="gap-2 shrink-0">
                  <a href={publication.file.href} download>
                    <HugeiconsIcon icon={Download04Icon} size={16} />
                    {publication.file.label}
                  </a>
                </Button>
              </div>
            )}
          </article>
        </div>

        {others.length > 0 && (
          <section aria-labelledby="publikasi-lainnya" className="mt-16 border-t pt-10">
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h2 id="publikasi-lainnya" className="text-lg font-medium">
                Publikasi lainnya
              </h2>
              <Link
                href="/publikasi"
                className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-4"
              >
                Semua publikasi
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.slice(0, 3).map((item) => (
                <PublicationCard key={item.slug} publication={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
