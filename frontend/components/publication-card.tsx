import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatPublicationDate, type Publication } from '@/lib/publications';

/**
 * One publication as a card: cover, kind and date, title, a two-line excerpt.
 * The whole card is the link, so the cover is clickable too; the title carries
 * the accessible name.
 */
export function PublicationCard({
  publication,
  className,
}: {
  publication: Publication;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-border/60 bg-background transition-colors hover:border-border',
        className
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <Image
          src={publication.cover.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-muted-foreground mb-2">
          {publication.type} · <time dateTime={publication.date}>{formatPublicationDate(publication.date)}</time>
        </p>
        <h3 className="text-base font-medium leading-snug mb-1.5">
          <Link
            href={`/publikasi/${publication.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none group-has-[:focus-visible]:underline underline-offset-4"
          >
            {publication.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{publication.excerpt}</p>
      </div>
    </article>
  );
}
