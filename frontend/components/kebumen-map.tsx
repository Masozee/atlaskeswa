"use client";

import { useMemo } from "react";
import Link from "next/link";
import { kategoriLabel } from "@/lib/utils/text";
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MapGeoJSON } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSurveyMapPoints, type SurveyMapPoint } from "@/hooks/use-survey-responses";
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

/** A survey point whose coordinates already parsed to finite numbers. */
type PlottedSurvey = SurveyMapPoint & { lat: number; lng: number };

const KATEGORI_COLOR: Record<string, string> = {
  FASKES: "#00979D",
  "NON FASKES": "#07579E",
};
const KATEGORI_UNKNOWN_COLOR = "#6B7280";

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

type KebumenMapProps = {
  className?: string;
  showControls?: boolean;
  height?: string;
  showMarkers?: boolean;
  showLegend?: boolean;
  facilityFilter?: string;
  serviceFilter?: string;
  kecamatanFilter?: string;
  onHoverKecamatan?: (name: string | null) => void;
  center?: [number, number];
  zoom?: number;
  /** Pass null to lift the default Kebumen pan restriction. Applied at map construction only — remount (key) to change. */
  maxBounds?: [[number, number], [number, number]] | null;
  /**
   * Mouse wheel over the map scrolls the page instead of zooming; ctrl/cmd + wheel
   * (or the zoom controls) zooms. Applied at map construction only.
   */
  cooperativeGestures?: boolean;
};

function SurveyMarker({ survey }: { survey: PlottedSurvey }) {
  const codes = survey.kode_desde_ltc ?? [];
  const shownCodes = codes.slice(0, 4);
  const surveyDate = formatSurveyDate(survey.survey_date);
  const isVerified = survey.verification_status === "VERIFIED";

  return (
    <MapMarker longitude={survey.lng} latitude={survey.lat}>
      <MarkerContent>
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-150"
          style={{ backgroundColor: kategoriColor(survey.kategori) }}
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

export function KebumenMap({
  className,
  showControls = true,
  height = "h-[300px]",
  showMarkers = true,
  showLegend = false,
  facilityFilter = "Semua",
  serviceFilter = "Semua",
  kecamatanFilter = "Semua",
  onHoverKecamatan,
  center = KEBUMEN_CENTER,
  zoom = 10,
  maxBounds = KEBUMEN_BOUNDS,
  cooperativeGestures = false,
}: KebumenMapProps) {
  const { data: surveyPoints } = useSurveyMapPoints();

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
        matchesFilter(survey.jenis_fasilitas, facilityFilter) &&
        matchesFilter(survey.jenis_layanan, serviceFilter) &&
        matchesFilter(survey.kecamatan, kecamatanFilter)
    );
  }, [surveyPoints, facilityFilter, serviceFilter, kecamatanFilter]);

  const handleFeatureHover = (feature: GeoJSON.Feature | null) => {
    if (onHoverKecamatan) {
      if (feature) {
        const kecamatanName = feature.properties?.nm_kecamatan;
        onHoverKecamatan(kecamatanName || null);
      } else {
        onHoverKecamatan(null);
      }
    }
  };

  return (
    <div className={cn(height, "relative w-full overflow-hidden", className)}>
      <Map
        center={center}
        zoom={zoom}
        {...(maxBounds ? { maxBounds } : {})}
        minZoom={9}
        maxZoom={15}
        cooperativeGestures={cooperativeGestures}
      >
        <MapGeoJSON
          data="/data/33.05_kecamatan.geojson"
          fillColor="#07579E"
          fillOpacity={0.2}
          strokeColor="#007A80"
          strokeWidth={1.5}
          strokeOpacity={0.8}
          onFeatureHover={handleFeatureHover}
        />
        {showMarkers && filteredSurveys.map((survey) => (
          <SurveyMarker key={survey.id} survey={survey} />
        ))}
        {showControls && (
          <MapControls position="top-right" showZoom showFullscreen />
        )}
      </Map>
      {showMarkers && showLegend && filteredSurveys.length > 0 && (
        <MapLegend count={filteredSurveys.length} />
      )}
    </div>
  );
}
