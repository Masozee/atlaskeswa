"use client"

import { useEffect } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface LeafletMapProps {
  center: [number, number]
  zoom: number
  markers?: Array<{
    id: number | string
    position: [number, number]
    popup?: string
    color?: string
    onClick?: () => void
  }>
  className?: string
}

export function LeafletMap({ center, zoom, markers, className }: LeafletMapProps) {
  useEffect(() => {
    // Create map
    const map = L.map("map").setView(center, zoom)

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add markers
    if (markers) {
      markers.forEach((marker) => {
        const icon = marker.color
          ? L.divIcon({
              className: "custom-marker",
              html: `<div style="background-color: ${marker.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })
          : undefined

        const leafletMarker = L.marker(marker.position, icon ? { icon } : {})

        if (marker.popup) {
          leafletMarker.bindPopup(marker.popup)
        }

        if (marker.onClick) {
          leafletMarker.on("click", marker.onClick)
        }

        leafletMarker.addTo(map)
      })
    }

    // Cleanup
    return () => {
      map.remove()
    }
  }, [center, zoom, markers])

  return <div id="map" className={className || "h-full w-full"} />
}
