/**
 * OMMHA's own publications — press releases, research reports and articles —
 * managed in the dashboard CMS (`/dashboard/publikasi`) and served by the
 * Django API at `/v1/publications/`. The body is a list of content blocks so
 * the detail page can typeset them.
 */

export type PublicationTypeCode = 'SIARAN_PERS' | 'LAPORAN' | 'ARTIKEL';
export type PublicationStatus = 'DRAFT' | 'PUBLISHED';

export const PUBLICATION_TYPES: { value: PublicationTypeCode; label: string }[] = [
  { value: 'SIARAN_PERS', label: 'Siaran pers' },
  { value: 'LAPORAN', label: 'Laporan' },
  { value: 'ARTIKEL', label: 'Artikel' },
];

export const PUBLICATION_STATUSES: { value: PublicationStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draf' },
  { value: 'PUBLISHED', label: 'Terbit' },
];

export type Block =
  /** Prose; accepts `*italic*`, `**bold**` and `[label](href)`. */
  | { type: 'p'; text: string }
  /** One of the OMMHA figures drawn as markup (see `ommha-diagrams.tsx`). */
  | { type: 'diagram'; diagram: 'desde-adaptation' | 'ommha-classification'; caption: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string; cite: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'image'; src: string; alt: string; width: number; height: number; caption?: string }
  /** A table of label/value rows; `indent` marks a breakdown of the row above. */
  | { type: 'table'; caption: string; head?: [string, string]; rows: { label: string; value: string; indent?: boolean; strong?: boolean }[] }
  /** A process drawn as numbered steps. */
  | { type: 'steps'; caption: string; items: string[] }
  /** Dated milestones. */
  | { type: 'timeline'; caption: string; items: { title: string; period: string }[] }
  | { type: 'callout'; title: string; items: string[] }
  | { type: 'note'; text: string };

export type BlockType = Block['type'];

/** The API row, as `/v1/publications/` returns it (asset paths already absolute). */
export interface PublicationRecord {
  id: number;
  slug: string;
  type: PublicationTypeCode;
  type_label: string;
  status: PublicationStatus;
  status_label: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  title: string;
  excerpt: string;
  author: string;
  period: string;
  cover_src: string;
  cover_alt: string;
  cover_credit: string;
  file_href: string;
  file_label: string;
  file_size: string;
  external_url: string;
  /** Absent from list responses. */
  body?: Block[];
  created_by_name: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
}

/** The shape the public components render. */
export interface Publication {
  slug: string;
  /** Display label, e.g. "Siaran pers". */
  type: string;
  date: string;
  title: string;
  excerpt: string;
  author: string;
  cover: { src: string; alt: string; credit?: string };
  period?: string;
  file?: { href: string; label: string; size: string };
  /** Published elsewhere: the card links straight out and there is no detail page. */
  externalUrl?: string;
  body: Block[];
}

export function toPublication(record: PublicationRecord): Publication {
  return {
    slug: record.slug,
    type: record.type_label,
    date: record.date,
    title: record.title,
    excerpt: record.excerpt,
    author: record.author,
    cover: {
      src: record.cover_src || '/OMMHA.png',
      alt: record.cover_alt,
      credit: record.cover_credit || undefined,
    },
    period: record.period || undefined,
    file: record.file_href
      ? { href: record.file_href, label: record.file_label || 'Unduh berkas', size: record.file_size }
      : undefined,
    externalUrl: record.external_url || undefined,
    body: record.body ?? [],
  };
}

/* ------------------------------------------------------------ server fetch */

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.atlaskeswa.id'}/v1/publications`;

/**
 * Published publications, newest first. Called from server components with no
 * auth, so drafts never leak. An unreachable API renders an empty list rather
 * than failing the page.
 */
export async function fetchPublications(): Promise<Publication[]> {
  try {
    const res = await fetch(`${API_BASE}/`, { cache: 'no-store' });
    if (!res.ok) return [];
    const records: PublicationRecord[] = await res.json();
    return records.map(toPublication);
  } catch {
    return [];
  }
}

/** One published publication with its body, or null (missing, draft, external). */
export async function fetchPublication(slug: string): Promise<Publication | null> {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}/`, { cache: 'no-store' });
    if (!res.ok) return null;
    const publication = toPublication(await res.json());
    return publication.externalUrl ? null : publication;
  } catch {
    return null;
  }
}

export function formatPublicationDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
