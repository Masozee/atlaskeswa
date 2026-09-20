'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PublicNav } from '@/components/public-nav';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { Map, MapControls, MapGeoJSON, MapMarker, MarkerContent } from '@/components/ui/map';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { FACILITY_TYPES, facilityIndex, facilityLabels } from '@/lib/facility-types';
import {
  useSurveyLocation,
  type SurveyLocationDetail,
  type SurveyLocationPhoto,
} from '@/hooks/use-survey-responses';
import { ServiceDetailMatrix } from '@/components/service-detail-matrix';
import { toSentenceCase } from '@/lib/utils/text';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

/**
 * The two kategori colours are the map legend. A visitor arrives from the map,
 * where teal means FASKES, so the encoding is carried through rather than
 * neutralised — it is the one piece of expressive colour on the page.
 */
const KATEGORI_COLOR: Record<string, string> = {
  FASKES: '#00979D',
  'NON FASKES': '#07579E',
};

const EMPTY = '—';

function formatSurveyDate(value: string | null) {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Splits "SA2 — Layanan …" into its code and its name. */
function splitDesdeCode(entry: string) {
  const sep = entry.indexOf(' — ');
  if (sep < 0) return { code: entry, name: '' };
  return { code: entry.slice(0, sep), name: entry.slice(sep + 3) };
}

/** "SI2.1.1" sorts after "SI1.3": segment by segment, numbers as numbers. */
function compareDesdeCode(a: string, b: string) {
  const segmentsA = a.split('.');
  const segmentsB = b.split('.');
  for (let i = 0; i < Math.max(segmentsA.length, segmentsB.length); i++) {
    const left = segmentsA[i] ?? '';
    const right = segmentsB[i] ?? '';
    const compared = left.localeCompare(right, 'en', { numeric: true });
    if (compared !== 0) return compared;
  }
  return 0;
}

/**
 * The classification arrives flat — the branch ("SA") next to its leaves
 * ("SA2", "SA4") — and every leaf name repeats its branch name in front of its
 * own. Grouped here so the branch is written once as a heading and each leaf
 * keeps only what it adds.
 */
type DesdeEntry = { code: string; name: string };
type DesdeGroup = DesdeEntry & { children: DesdeEntry[] };

function groupDesdeCodes(entries: string[]): DesdeGroup[] {
  const branchOf = (code: string) => code.match(/^[A-Za-z]+/)?.[0] ?? code;
  // A plain record, not a `Map`: `Map` in this module is the map component.
  const groups: Record<string, DesdeGroup> = {};

  for (const entry of entries.map(splitDesdeCode)) {
    const branch = branchOf(entry.code);
    const target = (groups[branch] ??= { code: branch, name: '', children: [] });
    if (entry.code === target.code) target.name = entry.name;
    else target.children.push(entry);
  }

  return Object.values(groups)
    .sort((a, b) => compareDesdeCode(a.code, b.code))
    .map((group) => {
      // A branch with no row of its own still gets a heading: its children all
      // carry the branch name as the first part of theirs.
      const name = group.name || group.children[0]?.name.split(', ')[0] || '';
      const prefix = name ? `${name}, ` : '';
      return {
        code: group.code,
        name,
        children: group.children
          .sort((a, b) => compareDesdeCode(a.code, b.code))
          .map((child) => ({
            code: child.code,
            name: child.name.startsWith(prefix) ? child.name.slice(prefix.length) : child.name,
          })),
      };
    });
}

/* ---------------------------------------------------------------- chapters */

/** A chapter: heading, then content. Space does the grouping, not a box. */
function Chapter({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="text-base font-medium mb-4">{title}</h2>
      {children}
    </section>
  );
}

/** One field: label over value, no questionnaire codes. */
function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-base mt-1 break-words">{value || EMPTY}</dd>
    </div>
  );
}

function Breadcrumb({ location }: { location: SurveyLocationDetail }) {
  const title = location.service_name ?? location.name ?? 'Lokasi';
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href="/"
            className="inline-block py-1 -my-1 hover:text-foreground transition-colors"
          >
            Peta
          </Link>
        </li>
        {location.kecamatan && (
          <>
            <li aria-hidden className="opacity-50">/</li>
            <li>Kec. {location.kecamatan}</li>
          </>
        )}
        <li aria-hidden className="opacity-50">/</li>
        <li className="text-foreground">{title}</li>
      </ol>
    </nav>
  );
}

/**
 * Masthead on the canvas rather than over the media.
 *
 * The previous version reserved a 420px band for a photo and filled it with a
 * brand gradient when there was none — which is the majority of records. The
 * title now reads the same either way, and a photo becomes its own chapter
 * below at full quality instead of sitting under a scrim.
 */
function Masthead({ location }: { location: SurveyLocationDetail }) {
  const title = location.service_name ?? location.name ?? 'Tanpa nama';
  const photos = location.photos.filter((photo) => photo.image_url);
  // Q4 is multi-select, so a place can wear more than one type.
  const types = facilityLabels(location.jenis_fasilitas).map((label) => ({
    label: toSentenceCase(label),
    color: FACILITY_TYPES[facilityIndex(label)]?.color ?? '#6B7280',
  }));

  return (
    <div className="pt-8 pb-8">
      <Breadcrumb location={location} />

      <div className="mt-5 grid gap-6 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div>
          {types.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {types.map((type) => (
                <Badge
                  key={type.label}
                  className="text-white border-0"
                  style={{ backgroundColor: type.color }}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="mt-3 text-[34px] sm:text-[42px] font-semibold tracking-tight leading-[1.08]">
            {title}
          </h1>

          {location.jenis_layanan && (
            // What the place actually does, read straight after its name rather
            // than found halfway down the record.
            /*
              The questionnaire authored these descriptions in caps. Only the
              all-caps runs are lowered, so ODGJ survives and the parenthetical
              clarifications stay in the mixed case they were written in.
            */
            <p className="mt-4 text-base text-foreground/80 leading-relaxed">
              {toSentenceCase(location.jenis_layanan)}
            </p>
          )}
        </div>

        {photos.length > 0 && (
          <div className="lg:sticky lg:top-6">
            <PhotoMedia photos={photos} />
          </div>
        )}
      </div>
    </div>
  );
}

/** One photo stands still; several become a carousel rather than a grid. */
function PhotoMedia({ photos }: { photos: SurveyLocationPhoto[] }) {
  const frame = 'relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted';

  if (photos.length === 1) {
    const [only] = photos;
    return (
      <figure>
        <div className={frame}>
          <Image
            src={only.image_url as string}
            alt={only.caption || 'Foto fasilitas'}
            fill
            priority
            sizes="(min-width: 1024px) 352px, 100vw"
            className="object-cover"
          />
        </div>
        {only.caption && (
          <figcaption className="mt-2 text-[13px] text-muted-foreground leading-snug">
            {only.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {photos.map((photo, index) => (
          <CarouselItem key={photo.id}>
            <figure>
              <div className={frame}>
                <Image
                  src={photo.image_url as string}
                  alt={photo.caption || `Foto fasilitas ${index + 1}`}
                  fill
                  // Only the first slide is worth pre-loading; the rest arrive
                  // as the reader asks for them.
                  priority={index === 0}
                  sizes="(min-width: 1024px) 352px, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[13px] text-muted-foreground leading-snug">
                {photo.caption || `Foto ${index + 1} dari ${photos.length}`}
              </figcaption>
            </figure>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
}

function LocationChapter({ location }: { location: SurveyLocationDetail }) {
  const lat = Number.parseFloat(location.latitude);
  const lng = Number.parseFloat(location.longitude);
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <Chapter title="Lokasi">
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        {hasPoint && (
          // The map keeps a boundary: it is media with its own edge, and
          // without one the basemap bleeds into the canvas.
          <div className="h-60 lg:h-64 w-full overflow-hidden rounded-lg border">
            <Map center={[lng, lat]} zoom={13} minZoom={8} maxZoom={17} cooperativeGestures>
              <MapGeoJSON
                data="/data/33.05_kecamatan.geojson"
                fillColor="#07579E"
                fillOpacity={0.08}
                strokeColor="#07579E"
                strokeWidth={1}
                strokeOpacity={0.35}
              />
              <MapMarker longitude={lng} latitude={lat}>
                <MarkerContent>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: KATEGORI_COLOR[location.kategori ?? ''] ?? '#6B7280' }}
                  />
                </MarkerContent>
              </MapMarker>
              <MapControls position="top-right" showZoom />
            </Map>
          </div>
        )}
        <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-1">
          <Field label="Kecamatan" value={location.kecamatan} />
          <Field label="Desa/Kelurahan" value={location.desa} />
          <Field label="Kabupaten/Kota" value={location.service_city} />
          <Field
            label="Koordinat"
            value={hasPoint ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : null}
          />
        </dl>
      </div>
    </Chapter>
  );
}

function ServiceChapter({ location }: { location: SurveyLocationDetail }) {
  const groups = groupDesdeCodes(location.kode_desde_ltc ?? []);
  if (groups.length === 0) return null;

  return (
    <Chapter title="Layanan">
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.code}>
            <div className="flex gap-3 text-[15px] font-medium">
              <span className="w-16 flex-shrink-0 tabular-nums">{group.code}</span>
              <span>{group.name}</span>
            </div>
            {group.children.length > 0 && (
              <ul className="mt-1.5 space-y-1 pl-[4.75rem] list-disc marker:text-muted-foreground">
                {group.children.map((child) => (
                  <li key={child.code} className="text-[15px] text-foreground/80">
                    <span className="font-medium tabular-nums text-foreground">{child.code}</span>{' '}
                    {child.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Chapter>
  );
}

/* ------------------------------------------------------------------ states */

function LoadingState() {
  return (
    <div className={cn(PUBLIC_CONTAINER, 'animate-pulse')} aria-hidden>
      <div className="pt-10 pb-12 space-y-4">
        <div className="h-3 w-48 rounded bg-muted" />
        <div className="h-10 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
      </div>
      <div className="h-72 rounded-lg bg-muted" />
    </div>
  );
}

function NotFoundState() {
  return (
    <div className={cn(PUBLIC_CONTAINER, 'py-24')}>
      <div className="max-w-[60ch]">
      <h1 className="text-3xl font-semibold tracking-tight">Lokasi tidak ditemukan</h1>
      <p className="text-base text-foreground/80 mt-3">
        Survei ini tidak tersedia untuk publik, atau sudah dihapus.
      </p>
      <Button asChild variant="outline" className="mt-8 gap-2">
        <Link href="/">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Kembali ke peta
        </Link>
      </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- page */

export default function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const numericId = Number.parseInt(id, 10);
  const { data: location, isLoading, isError } = useSurveyLocation(
    Number.isFinite(numericId) ? numericId : undefined
  );

  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />
      <PublicNav />

      {isLoading ? (
        <LoadingState />
      ) : isError || !location ? (
        <NotFoundState />
      ) : (
        <main className={cn(PUBLIC_CONTAINER, 'pb-24')}>
          <Masthead location={location} />

          {/* The one rule on the page: it divides the masthead from the record. */}
          <div className="border-t" />

          <div className="space-y-10 lg:space-y-12 pt-8 lg:pt-10">
            {/* The record and its per-branch detail are two readings of the
                same survey, so they share one surface rather than stacking. */}
            <Tabs defaultValue="profil">
              <TabsList>
                <TabsTrigger value="profil">Profil</TabsTrigger>
                {location.service_details?.length > 0 && (
                  <TabsTrigger value="rincian">Rincian layanan</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="profil" className="pt-6 space-y-10 lg:space-y-12">
                <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field
                    label="Bidang utama"
                    value={location.bidang_utama && toSentenceCase(location.bidang_utama)}
                  />
                  <Field
                    label="Status badan hukum"
                    value={location.status_badan_hukum && toSentenceCase(location.status_badan_hukum)}
                  />
                  <Field label="Tanggal survei" value={formatSurveyDate(location.survey_date)} />
                </dl>

                <LocationChapter location={location} />

                <ServiceChapter location={location} />
              </TabsContent>

              {location.service_details?.length > 0 && (
                <TabsContent value="rincian" className="pt-6">
                  <ServiceDetailMatrix details={location.service_details} />
                </TabsContent>
              )}
            </Tabs>
          </div>

          <div className="border-t mt-12 pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 py-1 -my-1 text-base font-medium hover:underline underline-offset-4"
            >
              Jelajahi lokasi lain di peta
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </div>
        </main>
      )}

      <PublicFooter />
    </div>
  );
}
