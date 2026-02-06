"use client";

import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MapGeoJSON } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

// Facility types
export const FACILITY_TYPES = ["Semua", "Rumah Sakit Umum", "Puskesmas", "Klinik"];

// Service types
export const SERVICE_TYPES = ["Semua", "Rawat Inap", "Rawat Jalan", "IGD Psikiatri", "Konseling", "Rujukan", "Deteksi Dini", "Konsultasi Psikiater", "Terapi", "Penyuluhan"];

// Sample healthcare facilities data
export const healthcareFacilities = [
  {
    id: 1,
    name: "RSUD Kebumen",
    type: "Rumah Sakit Umum",
    kecamatan: "Kebumen",
    address: "Jl. Tentara Pelajar No.17, Kebumen",
    latitude: -7.6714,
    longitude: 109.6503,
    image: "/tim-mossholder-8R-mXppeakM-unsplash.jpg",
    surveyStatus: "Terverifikasi",
    surveyDate: "15 Jan 2025",
    services: ["Rawat Inap", "Rawat Jalan", "IGD Psikiatri"],
  },
  {
    id: 2,
    name: "Puskesmas Gombong I",
    type: "Puskesmas",
    kecamatan: "Gombong",
    address: "Jl. Yos Sudarso No.45, Gombong",
    latitude: -7.6089,
    longitude: 109.5089,
    image: "/priscilla-du-preez-aPa843frIzI-unsplash.jpg",
    surveyStatus: "Terverifikasi",
    surveyDate: "12 Jan 2025",
    services: ["Konseling", "Rujukan"],
  },
  {
    id: 3,
    name: "Puskesmas Kutowinangun",
    type: "Puskesmas",
    kecamatan: "Kutowinangun",
    address: "Jl. Pahlawan No.12, Kutowinangun",
    latitude: -7.6456,
    longitude: 109.6978,
    image: "/a-c-ROSZ6bxrhnk-unsplash.jpg",
    surveyStatus: "Pending",
    surveyDate: "18 Jan 2025",
    services: ["Konseling", "Deteksi Dini"],
  },
  {
    id: 4,
    name: "Klinik Jiwa Sehat",
    type: "Klinik",
    kecamatan: "Kebumen",
    address: "Jl. Pemuda No.88, Kebumen",
    latitude: -7.6612,
    longitude: 109.6612,
    image: "/tim-mossholder-8R-mXppeakM-unsplash.jpg",
    surveyStatus: "Terverifikasi",
    surveyDate: "10 Jan 2025",
    services: ["Konsultasi Psikiater", "Terapi"],
  },
  {
    id: 5,
    name: "Puskesmas Karanganyar",
    type: "Puskesmas",
    kecamatan: "Karanganyar",
    address: "Jl. Raya Karanganyar No.1, Karanganyar",
    latitude: -7.5789,
    longitude: 109.5867,
    image: "/priscilla-du-preez-aPa843frIzI-unsplash.jpg",
    surveyStatus: "Terverifikasi",
    surveyDate: "8 Jan 2025",
    services: ["Konseling", "Penyuluhan"],
  },
  {
    id: 6,
    name: "Puskesmas Pejagoan",
    type: "Puskesmas",
    kecamatan: "Pejagoan",
    address: "Jl. Pejagoan Raya No.5, Pejagoan",
    latitude: -7.6234,
    longitude: 109.6234,
    image: "/a-c-ROSZ6bxrhnk-unsplash.jpg",
    surveyStatus: "Pending",
    surveyDate: "20 Jan 2025",
    services: ["Konseling", "Rujukan"],
  },
];

export type HealthcareFacility = typeof healthcareFacilities[0];

type KebumenMapProps = {
  className?: string;
  showControls?: boolean;
  height?: string;
  showMarkers?: boolean;
  facilityFilter?: string;
  serviceFilter?: string;
  kecamatanFilter?: string;
  onHoverKecamatan?: (name: string | null) => void;
};

function FacilityMarker({ facility }: { facility: typeof healthcareFacilities[0] }) {
  const getMarkerColor = (type: string) => {
    switch (type) {
      case "Rumah Sakit Umum":
        return "bg-red-500";
      case "Puskesmas":
        return "bg-blue-500";
      case "Klinik":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Terverifikasi" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700";
  };

  return (
    <MapMarker
      longitude={facility.longitude}
      latitude={facility.latitude}
    >
      <MarkerContent>
        <div className={cn(
          "w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-125",
          getMarkerColor(facility.type)
        )} />
      </MarkerContent>
      <MarkerPopup closeButton className="w-72 p-0 overflow-hidden">
        <div className="relative h-28 w-full">
          <Image
            src={facility.image}
            alt={facility.name}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2">
            <Badge className={cn("text-[10px] px-2 py-0.5", getStatusColor(facility.surveyStatus))}>
              {facility.surveyStatus}
            </Badge>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div>
            <h4 className="font-semibold text-sm">{facility.name}</h4>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1">
              {facility.type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {facility.address}
          </p>
          <div className="pt-1 border-t">
            <p className="text-[10px] text-muted-foreground mb-1">Layanan:</p>
            <div className="flex flex-wrap gap-1">
              {facility.services.map((service, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t text-[10px] text-muted-foreground">
            <span>Survei terakhir:</span>
            <span className="font-medium">{facility.surveyDate}</span>
          </div>
        </div>
      </MarkerPopup>
    </MapMarker>
  );
}

export function KebumenMap({
  className,
  showControls = true,
  height = "h-[300px]",
  showMarkers = true,
  facilityFilter = "Semua",
  serviceFilter = "Semua",
  kecamatanFilter = "Semua",
  onHoverKecamatan,
}: KebumenMapProps) {
  // Filter facilities based on props
  const filteredFacilities = healthcareFacilities.filter((facility) => {
    // Facility type filter
    if (facilityFilter !== "Semua" && facility.type !== facilityFilter) {
      return false;
    }
    // Service filter
    if (serviceFilter !== "Semua" && !facility.services.includes(serviceFilter)) {
      return false;
    }
    // Kecamatan filter
    if (kecamatanFilter !== "Semua" && facility.kecamatan !== kecamatanFilter) {
      return false;
    }
    return true;
  });

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
    <div className={cn(height, "w-full overflow-hidden", className)}>
      <Map
        center={KEBUMEN_CENTER}
        zoom={10}
        maxBounds={KEBUMEN_BOUNDS}
        minZoom={9}
        maxZoom={15}
      >
        <MapGeoJSON
          data="/data/33.05_kecamatan.geojson"
          fillColor="#00979D"
          fillOpacity={0.2}
          strokeColor="#007A80"
          strokeWidth={1.5}
          strokeOpacity={0.8}
          onFeatureHover={handleFeatureHover}
        />
        {showMarkers && filteredFacilities.map((facility) => (
          <FacilityMarker key={facility.id} facility={facility} />
        ))}
        {showControls && (
          <MapControls position="top-right" showZoom showFullscreen />
        )}
      </Map>
    </div>
  );
}
