"use client";

import { Map, useMap, MapControls, MapMarker, MarkerContent, MarkerPopup } from "@/components/ui/map";
import { useEffect, useState } from "react";
import type MapLibreGL from "maplibre-gl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

// Kebumen center coordinates
const KEBUMEN_CENTER: [number, number] = [109.6753, -7.6079];
const KEBUMEN_BOUNDS: [[number, number], [number, number]] = [
  [109.4, -7.9], // Southwest
  [110.0, -7.4], // Northeast
];

// Sample healthcare facilities data
const healthcareFacilities = [
  {
    id: 1,
    name: "RSUD Kebumen",
    type: "Rumah Sakit Umum",
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
    address: "Jl. Pejagoan Raya No.5, Pejagoan",
    latitude: -7.6234,
    longitude: 109.6234,
    image: "/a-c-ROSZ6bxrhnk-unsplash.jpg",
    surveyStatus: "Pending",
    surveyDate: "20 Jan 2025",
    services: ["Konseling", "Rujukan"],
  },
];

type KebumenMapProps = {
  className?: string;
  showControls?: boolean;
  height?: string;
  showMarkers?: boolean;
};

function KebumenGeoJSONLayer() {
  const { map, isLoaded } = useMap();
  const [geoJsonLoaded, setGeoJsonLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded || !map || geoJsonLoaded) return;

    const addGeoJSON = async () => {
      try {
        const response = await fetch("/geojson/Kebumen.geojson");
        const geojson = await response.json();

        // Add source
        if (!map.getSource("kebumen-boundary")) {
          map.addSource("kebumen-boundary", {
            type: "geojson",
            data: geojson,
          });
        }

        // Add fill layer
        if (!map.getLayer("kebumen-fill")) {
          map.addLayer({
            id: "kebumen-fill",
            type: "fill",
            source: "kebumen-boundary",
            paint: {
              "fill-color": "#4DA1DB",
              "fill-opacity": 0.15,
            },
          });
        }

        // Add outline layer
        if (!map.getLayer("kebumen-outline")) {
          map.addLayer({
            id: "kebumen-outline",
            type: "line",
            source: "kebumen-boundary",
            paint: {
              "line-color": "#4DA1DB",
              "line-width": 2,
              "line-opacity": 0.8,
            },
          });
        }

        setGeoJsonLoaded(true);
      } catch (error) {
        console.error("Failed to load Kebumen GeoJSON:", error);
      }
    };

    // Wait for style to be fully loaded
    if (map.isStyleLoaded()) {
      addGeoJSON();
    } else {
      map.once("styledata", addGeoJSON);
    }

    return () => {
      // Cleanup on unmount
      try {
        if (map.getLayer("kebumen-fill")) map.removeLayer("kebumen-fill");
        if (map.getLayer("kebumen-outline")) map.removeLayer("kebumen-outline");
        if (map.getSource("kebumen-boundary")) map.removeSource("kebumen-boundary");
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [isLoaded, map, geoJsonLoaded]);

  // Re-add layers when style changes (dark/light mode)
  useEffect(() => {
    if (!map) return;

    const handleStyleData = () => {
      setGeoJsonLoaded(false);
    };

    map.on("style.load", handleStyleData);

    return () => {
      map.off("style.load", handleStyleData);
    };
  }, [map]);

  return null;
}

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
}: KebumenMapProps) {
  return (
    <div className={cn(height, "w-full overflow-hidden", className)}>
      <Map
        center={KEBUMEN_CENTER}
        zoom={9}
        maxBounds={KEBUMEN_BOUNDS}
        minZoom={8}
        maxZoom={14}
      >
        <KebumenGeoJSONLayer />
        {showMarkers && healthcareFacilities.map((facility) => (
          <FacilityMarker key={facility.id} facility={facility} />
        ))}
        {showControls && (
          <MapControls position="top-right" showZoom showFullscreen />
        )}
      </Map>
    </div>
  );
}
