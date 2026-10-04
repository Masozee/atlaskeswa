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
import { cn } from '@/lib/utils';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import {
  PUBLICATIONS,
  formatPublicationDate,
  getPublication,
  sortedPublications,
  type Block,
  type Publication,
} from '@/lib/publications';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Download04Icon } from '@hugeicons/core-free-icons';

// Every publication is known at build time; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLICATIONS.map((publication) => ({ slug: publication.slug }));
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

function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* ------------------------------------------------------------------ blocks */

function Caption({ children }: { children: React.ReactNode }) {
  return <figcaption className="mt-3 text-[13px] text-muted-foreground leading-snug">{children}</figcaption>;
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return <p>{block.text}</p>;

    case 'h2':
      return (
        <h2 id={headingId(block.text)} className="scroll-mt-6 pt-6 text-xl font-semibold tracking-tight text-foreground">
          {block.text}
        </h2>
      );

    case 'quote':
      return (
        <figure className="border-l-2 border-[#00979D] pl-5">
          <blockquote className="text-lg leading-relaxed text-foreground">“{block.text}”</blockquote>
          <figcaption className="mt-2 text-sm text-muted-foreground">— {block.cite}</figcaption>
        </figure>
      );

    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List className={cn('space-y-2 pl-5', block.ordered ? 'list-decimal' : 'list-disc', 'marker:text-muted-foreground')}>
          {block.items.map((item) => (
            <li key={item} className="pl-1">
              {item}
            </li>
          ))}
        </List>
      );
    }

    case 'image': {
      // A portrait diagram at full column width would run three screens tall.
      const portrait = block.height > block.width;
      return (
        <figure className={cn('py-2', portrait && 'max-w-md')}>
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            sizes={portrait ? '448px' : '(min-width: 1024px) 680px, 100vw'}
            className="w-full h-auto rounded-lg border"
          />
          {block.caption && <Caption>{block.caption}</Caption>}
        </figure>
      );
    }

    case 'table':
      return (
        <figure className="py-2">
          <Caption>{block.caption}</Caption>
          <table className="mt-3 w-full border-collapse text-[15px]">
            {block.head && (
              <thead>
                <tr className="border-b border-foreground/40">
                  <th className="py-2 pr-4 text-left font-medium">{block.head[0]}</th>
                  <th className="py-2 text-right font-medium">{block.head[1]}</th>
                </tr>
              </thead>
            )}
            <tbody className={cn(!block.head && 'border-t border-foreground/40')}>
              {block.rows.map((row) => (
                <tr key={row.label} className="border-b">
                  <th
                    scope="row"
                    className={cn(
                      'py-2 pr-4 text-left',
                      row.strong ? 'font-medium text-foreground' : 'font-normal',
                      row.indent && 'pl-5 text-muted-foreground'
                    )}
                  >
                    {row.label}
                  </th>
                  <td className={cn('py-2 text-right tabular-nums', row.strong && 'font-medium text-foreground')}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );

    case 'steps':
      return (
        <figure className="py-2">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((item, index) => (
              <li key={item} className="flex gap-3 rounded-lg border bg-muted/30 p-4">
                <span
                  aria-hidden
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#07579E] text-xs font-medium text-white tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="text-[15px] leading-snug text-foreground">{item}</span>
              </li>
            ))}
          </ol>
          <Caption>{block.caption}</Caption>
        </figure>
      );

    case 'timeline':
      return (
        <figure className="py-2">
          <ol className="relative space-y-5 border-l border-border pl-6">
            {block.items.map((item) => (
              <li key={item.title} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.84rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-[#07579E]"
                />
                <p className="text-[15px] font-medium leading-snug text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.period}</p>
              </li>
            ))}
          </ol>
          <Caption>{block.caption}</Caption>
        </figure>
      );

    case 'callout':
      return (
        <aside className="rounded-lg bg-[#07579E] p-5 text-white">
          <p className="text-[15px] font-medium">{block.title}</p>
          <ul className="mt-3 space-y-1.5 list-disc pl-5 text-[15px] text-white/90 marker:text-white/60">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      );

    case 'note':
      return (
        <p className="border-l-2 border-border pl-4 text-sm text-muted-foreground leading-relaxed">{block.text}</p>
      );
  }
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
