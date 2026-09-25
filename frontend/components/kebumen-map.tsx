"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { kategoriLabel } from "@/lib/utils/text";
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MapGeoJSON } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSurveyMapPoints, type SurveyMapPoint } from "@/hooks/use-survey-responses";
import { useSecondaryChoropleth, type ChoroplethRow } from "@/hooks/use-secondary";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

// Kebumen center coordinates (based on 33.05_kecamatan.geojson bounds)
const KEBUMEN_CENTER: [number, number] = [109.6090, -7.6385];
const KEBUMEN_BOUNDS: [[number, number], [number, number]] = [
  [109.35, -7.85], // Southwest
  [109.86, -7.42], // Northeast
];

// Kecamatan list in Kebumen
export const KEBUMEN_KECAMATAN = [
  "Kebumen", "Gombong", "Kutowinangun", "Karanganyar", "Pejagoan", "Prembun",
  "Sruweng", "Buluspesantren", "Ambal", "Mirit", "Petanahan", "Klirong",
  "Puring", "Buayan", "Ayah", "Rowokele", "Sempor", "Karanggayam",
  "Sadang", "Karangsambung", "Alian", "Poncowarno", "Padureso", "Bonorowo",
  "Kuwarasan", "Adimulyo"
];

const KECAMATAN_GEOJSON = "/data/33.05_kecamatan.geojson";

/**
 * Sequential ramp for the choropleth, tinted from the brand teal. Five steps:
 * enough to read a pattern, few enough to tell apart in a legend.
 */
const CHOROPLETH_RAMP = ["#D7EEEF", "#A5D9DB", "#63BCC0", "#2C9DA3", "#0B6E73"];
const CHOROPLETH_EMPTY = "#E5E7EB";
/** Written onto a feature the dataset has no row for. */
const NO_DATA = -1;

/**
 * Break points at even quantiles of the data rather than of the range: district
 * rates are skewed, and equal-width buckets put 20 of 26 kecamatan in one
 * colour. Returns the four thresholds between the five ramp steps.
 */
function quantileBreaks(values: number[]) {
  const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const breaks: number[] = [];
  for (let i = 1; i < CHOROPLETH_RAMP.length; i++) {
    const position = (sorted.length - 1) * (i / CHOROPLETH_RAMP.length);
    const value = sorted[Math.round(position)];
    // A step expression needs strictly ascending stops; nudge past a tie rather
    // than dropping the bucket, so the legend keeps five rows.
    const previous = breaks[breaks.length - 1];
    breaks.push(previous !== undefined && value <= previous ? previous + 0.01 : value);
  }
  return breaks;
}

function formatRate(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

/** A survey point whose coordinates already parsed to finite numbers. */
type PlottedSurvey = SurveyMapPoint & { lat: number; lng: number };

export const KATEGORI_COLOR: Record<string, string> = {
  FASKES: "#00979D",
  "NON FASKES": "#07579E",
};
const KATEGORI_UNKNOWN_COLOR = "#6B7280";

/** Marker filter value: a kategori, or every kategori. */
export type KategoriFilter = "Semua" | "FASKES" | "NON FASKES";

function kategoriColor(kategori: string | null) {
  return (kategori && KATEGORI_COLOR[kategori]) || KATEGORI_UNKNOWN_COLOR;
}

function formatSurveyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/** Survey answers are free text, so match loosely rather than by equality. */
function matchesFilter(value: string | null, filter: string) {
  if (filter === "Semua") return true;
  if (!value) return false;
  return value.toLowerCase().includes(filter.toLowerCase());
}

/** "SA2 — Layanan …" classifies under branch SA. */
export function desdeBranch(entry: string) {
  const code = entry.split(" — ")[0];
  return (code.match(/^[A-Za-z]+/)?.[0] ?? code).toUpperCase();
}

type KebumenMapProps = {
  className?: string;
  showControls?: boolean;
  height?: string;
  showMarkers?: boolean;
  showLegend?: boolean;
  facilityFilter?: string;
  serviceFilter?: string;
  kecamatanFilter?: string;
  /** "Semua", "FASKES" or "NON FASKES" — filters the markers by kategori. */
  kategoriFilter?: KategoriFilter;
  /**
   * DESDE-LTC branches (e.g. ["R", "SR"]) a survey must be classified under at
   * least one of to show; null shows every survey.
   */
  desdeBranches?: string[] | null;
  /**
   * The colours a marker is painted in, split into equal wedges when there is
   * more than one; unset (or an empty list) colours it by its kategori.
   */
  markerColors?: (survey: SurveyMapPoint) => string[];
  onHoverKecamatan?: (name: string | null) => void;
  /** Clicking a kecamatan polygon reports its name; clicking it again clears. */
  onSelectKecamatan?: (name: string | null) => void;
  /** The clicked kecamatan, outlined so the selection is visible on the map. */
  selectedKecamatan?: string | null;
  center?: [number, number];
  zoom?: number;
  /** Pass null to lift the default Kebumen pan restriction. Applied at map construction only — remount (key) to change. */
  maxBounds?: [[number, number], [number, number]] | null;
  /**
   * Mouse wheel over the map scrolls the page instead of zooming; ctrl/cmd + wheel
   * (or the zoom controls) zooms. Applied at map construction only.
   */
  cooperativeGestures?: boolean;
  /** Colour the kecamatan by secondary data, per 10,000 people. */
  choropleth?: boolean;
  /** Indicator code to colour by; omitted sums the clinical indicators. */
  choroplethIndicator?: string;
  /**
   * Bring one kecamatan forward and dim the rest, and frame the camera on it.
   * The neighbours stay drawn: a district with no surroundings is not a place.
   */
  highlightKecamatan?: string;
};

/** Equal wedges, one per colour: a facility offering three types shows all three. */
function markerFill(colors: string[]) {
  if (colors.length === 1) return colors[0];
  const step = 360 / colors.length;
  const stops = colors.map((color, i) => `${color} ${i * step}deg ${(i + 1) * step}deg`);
  return `conic-gradient(${stops.join(", ")})`;
}

function SurveyMarker({ survey, colors }: { survey: PlottedSurvey; colors: string[] | null }) {
  const codes = survey.kode_desde_ltc ?? [];
  const shownCodes = codes.slice(0, 4);
  const surveyDate = formatSurveyDate(survey.survey_date);
  const isVerified = survey.verification_status === "VERIFIED";

  return (
    <MapMarker longitude={survey.lng} latitude={survey.lat}>
      <MarkerContent>
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-150"
          style={{ background: colors?.length ? markerFill(colors) : kategoriColor(survey.kategori) }}
        />
      </MarkerContent>
      <MarkerPopup closeButton className="w-72 p-0 overflow-hidden">
        {survey.thumbnail && (
          <div className="relative h-28 w-full">
            <Image
              src={survey.thumbnail}
              alt={survey.name ?? "Foto fasilitas"}
              fill
              sizes="288px"
              className="object-cover"
            />
          </div>
        )}
        <div className="p-3 space-y-2">
          <div>
            <Link
              href={`/lokasi/${survey.id}`}
              className="font-semibold text-sm leading-snug text-primary hover:underline"
            >
              {survey.name ?? survey.service_name ?? "Tanpa nama"}
            </Link>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {survey.kategori && (
                <Badge
                  className="text-[10px] px-1.5 py-0 text-white"
                  style={{ backgroundColor: kategoriColor(survey.kategori) }}
                >
                  {kategoriLabel(survey.kategori)}
                </Badge>
              )}
              <Badge
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}
              >
                {survey.status_display}
              </Badge>
            </div>
          </div>

          {survey.jenis_fasilitas && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {survey.jenis_fasilitas}
            </p>
          )}

          {(survey.kecamatan || survey.desa) && (
            <p className="text-xs">
              {[survey.desa, survey.kecamatan].filter(Boolean).join(", ")}
            </p>
          )}

          {shownCodes.length > 0 && (
            <div className="pt-1 border-t">
              <p className="text-[10px] text-muted-foreground mb-1">Kode DESDE-LTC:</p>
              <div className="flex flex-wrap gap-1">
                {shownCodes.map((code) => (
                  <span
                    key={code}
                    title={code}
                    className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                  >
                    {code.split(" — ")[0]}
                  </span>
                ))}
                {codes.length > shownCodes.length && (
                  <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                    +{codes.length - shownCodes.length}
                  </span>
                )}
              </div>
            </div>
          )}

          {surveyDate && (
            <div className="flex items-center justify-between pt-1 border-t text-[10px] text-muted-foreground">
              <span>Tanggal survei:</span>
              <span className="font-medium">{surveyDate}</span>
            </div>
          )}

          <Link
            href={`/lokasi/${survey.id}`}
            className="block pt-1 border-t text-xs font-medium text-primary hover:underline"
          >
            Lihat detail lokasi →
          </Link>
        </div>
      </MarkerPopup>
    </MapMarker>
  );
}

function MapLegend({ count }: { count: number }) {
  return (
    <div className="absolute left-4 top-16 lg:top-6 z-10 rounded-md border bg-background/85 backdrop-blur px-3 py-2 text-xs">
      <p className="font-medium mb-1.5">{count} titik survei</p>
      <div className="space-y-1">
        {[
          { label: "Faskes", color: KATEGORI_COLOR.FASKES },
          { label: "Non-faskes", color: KATEGORI_COLOR["NON FASKES"] },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChoroplethLegend({
  breaks,
  label,
  source,
}: {
  breaks: number[];
  label: string;
  source: string | null;
}) {
  // Rows read "0–18", "18–27", … "63+": the bucket a reader lands in when they
  // hover a kecamatan.
  const rows = CHOROPLETH_RAMP.map((color, index) => {
    const from = index === 0 ? 0 : breaks[index - 1];
    const to = breaks[index];
    return {
      color,
      label: to === undefined ? `${formatRate(from)}+` : `${formatRate(from)}–${formatRate(to)}`,
    };
  });

  return (
    // Stacked under the marker legend at top-left: the bottom-right corner is
    // where the landing page pins its charts, and the bottom edge carries the
    // hero copy.
    <div className="absolute left-4 lg:left-6 top-44 lg:top-32 z-10 rounded-md border bg-background/85 backdrop-blur px-3 py-2 text-xs max-w-[210px]">
      <p className="font-medium leading-snug">{label}</p>
      <p className="text-muted-foreground mb-1.5">per 10.000 penduduk</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-4 rounded-sm border border-black/10"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-muted-foreground tabular-nums">{row.label}</span>
          </div>
        ))}
      </div>
      {source && <p className="text-muted-foreground mt-1.5 leading-snug">Sumber: {source}</p>}
    </div>
  );
}

export function KebumenMap({
  className,
  showControls = true,
  height = "h-[300px]",
  showMarkers = true,
  showLegend = false,
  facilityFilter = "Semua",
  serviceFilter = "Semua",
  kecamatanFilter = "Semua",
  kategoriFilter = "Semua",
  desdeBranches = null,
  markerColors,
  onHoverKecamatan,
  onSelectKecamatan,
  selectedKecamatan = null,
  center = KEBUMEN_CENTER,
  zoom = 10,
  maxBounds = KEBUMEN_BOUNDS,
  cooperativeGestures = false,
  choropleth = false,
  choroplethIndicator,
  highlightKecamatan,
}: KebumenMapProps) {
  const { data: surveyPoints } = useSurveyMapPoints();
  const { data: choroplethData } = useSecondaryChoropleth(choroplethIndicator);
  // The base map hands MapGeoJSON a URL and lets it fetch. A choropleth has to
  // carry the values on the features, so the file is read here instead and the
  // rates merged in before the layer ever sees it.
  const { data: geoJson } = useQuery<GeoJSON.FeatureCollection>({
    queryKey: ['kebumen-kecamatan-geojson'],
    queryFn: async () => {
      const res = await fetch(KECAMATAN_GEOJSON);
      if (!res.ok) throw new Error('Gagal memuat batas kecamatan');
      return res.json();
    },
    enabled: choropleth || !!highlightKecamatan,
    staleTime: Infinity, // district boundaries do not move
  });

  const choroplethLayer = useMemo(() => {
    if (!choropleth || !geoJson || !choroplethData?.series?.length) return null;

    // A plain record, not a Map: `Map` in this module is the map component.
    const rates: Record<string, ChoroplethRow> = {};
    for (const row of choroplethData.series) {
      rates[row.kecamatan.trim().toUpperCase()] = row;
    }
    const data: GeoJSON.FeatureCollection = {
      ...geoJson,
      features: geoJson.features.map((feature) => {
        const name = String(feature.properties?.nm_kecamatan ?? '').trim().toUpperCase();
        const row = rates[name];
        return {
          ...feature,
          properties: {
            ...feature.properties,
            // A sentinel rather than null: MapLibre expressions cannot compare
            // against null, so a missing value is written below the scale and
            // caught by the step's own default colour.
            per_10k: row?.per_10k ?? NO_DATA,
          },
        };
      }),
    };

    const breaks = quantileBreaks(
      choroplethData.series
        .map((row) => row.per_10k)
        .filter((value): value is number => value !== null)
    );
    // Below 0 sits only the sentinel, so the step's default paints the
    // kecamatan the dataset has nothing to say about.
    const fillColor: unknown[] = [
      'step', ['get', 'per_10k'], CHOROPLETH_EMPTY, 0, CHOROPLETH_RAMP[0],
    ];
    breaks.forEach((breakpoint, index) => {
      fillColor.push(breakpoint, CHOROPLETH_RAMP[index + 1]);
    });

    const indicator = choroplethIndicator
      ? choroplethData.dataset?.indicators.find((i) => i.code === choroplethIndicator)?.name
      : 'Gangguan jiwa (gabungan)';

    return {
      data,
      fillColor,
      breaks,
      label: indicator ?? 'Gangguan jiwa',
      source: choroplethData.dataset?.source || null,
    };
  }, [choropleth, geoJson, choroplethData, choroplethIndicator]);

  // Memoised because hovering a kecamatan re-renders this component: without it
  // every marker would get fresh props on each mouse move.
  const filteredSurveys = useMemo<PlottedSurvey[]>(() => {
    // Coordinates arrive as DecimalField strings; drop anything unparseable so
    // a bad GPS fix cannot throw a marker off the map.
    const plotted = (surveyPoints ?? []).flatMap<PlottedSurvey>((point) => {
      const lat = Number.parseFloat(point.latitude);
      const lng = Number.parseFloat(point.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      return [{ ...point, lat, lng }];
    });

    return plotted.filter(
      (survey) =>
        // Kategori is a closed vocabulary, so it is matched exactly rather than
        // by the loose contains used on the free-text answers.
        (kategoriFilter === "Semua" || survey.kategori === kategoriFilter) &&
        matchesFilter(survey.jenis_fasilitas, facilityFilter) &&
        matchesFilter(survey.jenis_layanan, serviceFilter) &&
        matchesFilter(survey.kecamatan, kecamatanFilter) &&
        (!desdeBranches ||
          (survey.kode_desde_ltc ?? []).some((entry) => desdeBranches.includes(desdeBranch(entry))))
    );
  }, [surveyPoints, kategoriFilter, facilityFilter, serviceFilter, kecamatanFilter, desdeBranches]);

  const selection = useMemo(() => {
    if (!selectedKecamatan) return null;
    const matches = ["==", ["downcase", ["get", "nm_kecamatan"]], selectedKecamatan.toLowerCase()];
    return {
      strokeColor: ["case", matches, "#00595D", "#007A80"] as unknown[],
      strokeWidth: ["case", matches, 3, 1.5] as unknown[],
      strokeOpacity: ["case", matches, 1, 0.55] as unknown[],
    };
  }, [selectedKecamatan]);

  const highlight = useMemo(() => {
    if (!highlightKecamatan) return null;
    const matches = ["==", ["downcase", ["get", "nm_kecamatan"]], highlightKecamatan.toLowerCase()];
    return {
      // The chosen kecamatan keeps its colour; its neighbours drop to a wash,
      // so the shape reads at a glance without losing the surrounding context.
      fillOpacity: ["case", matches, 0.9, 0.12] as unknown[],
      strokeColor: ["case", matches, "#00595D", "#007A80"] as unknown[],
      strokeWidth: ["case", matches, 3, 0.75] as unknown[],
      strokeOpacity: ["case", matches, 1, 0.35] as unknown[],
    };
  }, [highlightKecamatan]);

  // The camera is set at construction, so the bounds are computed once from the
  // polygon itself rather than hard-coded per kecamatan.
  const highlightBounds = useMemo(() => {
    if (!highlightKecamatan || !geoJson) return null;
    const feature = geoJson.features.find(
      (f) =>
        String(f.properties?.nm_kecamatan ?? '').trim().toLowerCase() ===
        highlightKecamatan.trim().toLowerCase()
    );
    if (!feature) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const walk = (coords: unknown): void => {
      if (Array.isArray(coords) && typeof coords[0] === "number" && typeof coords[1] === "number") {
        const [x, y] = coords as [number, number];
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        return;
      }
      if (Array.isArray(coords)) coords.forEach(walk);
    };
    walk((feature.geometry as { coordinates?: unknown }).coordinates);
    if (!Number.isFinite(minX)) return null;
    return [[minX, minY], [maxX, maxY]] as [[number, number], [number, number]];
  }, [highlightKecamatan, geoJson]);

  // The name follows the cursor rather than sitting in a fixed corner: with 26
  // districts, reading a colour meant looking away from the polygon under the
  // pointer and back again.
  const [hoverLabel, setHoverLabel] = useState<
    { name: string; rate: number | null; x: number; y: number } | null
  >(null);

  const handleFeatureClick = (feature: GeoJSON.Feature) => {
    const name = (feature.properties?.nm_kecamatan as string | undefined) ?? null;
    if (!onSelectKecamatan) return;
    // Clicking the selected kecamatan again clears it: the map is also the way
    // back out of a selection.
    onSelectKecamatan(name && name === selectedKecamatan ? null : name);
  };

  const handleFeatureHover = (
    feature: GeoJSON.Feature | null,
    event?: { point?: { x: number; y: number } }
  ) => {
    const kecamatanName = feature ? (feature.properties?.nm_kecamatan as string | undefined) : null;

    if (feature && kecamatanName && event?.point) {
      const rate = feature.properties?.per_10k;
      setHoverLabel({
        name: kecamatanName,
        rate: typeof rate === "number" && rate >= 0 ? rate : null,
        x: event.point.x,
        y: event.point.y,
      });
    } else {
      setHoverLabel(null);
    }

    if (onHoverKecamatan) {
      onHoverKecamatan(kecamatanName || null);
    }
  };

  return (
    <div className={cn(height, "relative w-full overflow-hidden", className)}>
      <Map
        // Remount once the polygon is known: MapLibre reads the camera at
        // construction, so a later bounds prop would be ignored.
        key={highlightBounds ? `bounds-${highlightKecamatan}` : undefined}
        {...(highlightBounds
          ? { bounds: highlightBounds, fitBoundsOptions: { padding: 48 } }
          : { center, zoom })}
        {...(maxBounds ? { maxBounds } : {})}
        minZoom={9}
        maxZoom={15}
        cooperativeGestures={cooperativeGestures}
      >
        <MapGeoJSON
          data={choroplethLayer?.data ?? KECAMATAN_GEOJSON}
          fillColor={choroplethLayer?.fillColor ?? "#07579E"}
          // The choropleth carries its own scale, so it is painted at full
          // strength; the flat fill stays a wash over the basemap.
          fillOpacity={highlight?.fillOpacity ?? (choroplethLayer ? 0.85 : 0.2)}
          strokeColor={highlight?.strokeColor ?? selection?.strokeColor ?? "#007A80"}
          strokeWidth={highlight?.strokeWidth ?? selection?.strokeWidth ?? 1.5}
          strokeOpacity={highlight?.strokeOpacity ?? selection?.strokeOpacity ?? 0.8}
          onFeatureHover={handleFeatureHover}
          {...(onSelectKecamatan ? { onFeatureClick: handleFeatureClick } : {})}
        />
        {showMarkers && filteredSurveys.map((survey) => (
          <SurveyMarker key={survey.id} survey={survey} colors={markerColors?.(survey) ?? null} />
        ))}
        {showControls && (
          <MapControls position="top-right" showZoom showFullscreen />
        )}
      </Map>
      {showMarkers && showLegend && filteredSurveys.length > 0 && (
        <MapLegend count={filteredSurveys.length} />
      )}
      {hoverLabel && (
        <div
          // Sits above the pointer and never under it: pointer-events-none, or
          // the label would take the hover it is describing and flicker.
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md border bg-background/95 backdrop-blur px-2.5 py-1.5 text-xs shadow-sm whitespace-nowrap"
          style={{ left: hoverLabel.x, top: hoverLabel.y - 14 }}
        >
          <span className="font-medium">Kec. {hoverLabel.name}</span>
          {hoverLabel.rate !== null && (
            <span className="block text-muted-foreground tabular-nums">
              {formatRate(hoverLabel.rate)} per 10.000
            </span>
          )}
        </div>
      )}
      {choroplethLayer && (
        <ChoroplethLegend
          breaks={choroplethLayer.breaks}
          label={choroplethLayer.label}
          source={choroplethLayer.source}
        />
      )}
    </div>
  );
}
