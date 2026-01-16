"use client"

import { useEffect } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

interface LeafletHeatmapProps {
  center: [number, number]
  zoom: number
  heatmapData: HeatmapPoint[]
  className?: string
}

export function LeafletHeatmap({ center, zoom, heatmapData, className }: LeafletHeatmapProps) {
  useEffect(() => {
    // Create map
    const map = L.map("heatmap").setView(center, zoom)

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add circle markers for heatmap visualization
    heatmapData.forEach((point) => {
      const normalized = point.intensity
      const radius = 20000 + normalized * 80000 // 20-100km radius
      const opacity = 0.2 + normalized * 0.4 // 0.2-0.6 opacity

      const color =
        normalized > 0.8
          ? "#dc2626"
          : normalized > 0.6
          ? "#ea580c"
          : normalized > 0.4
          ? "#facc15"
          : normalized > 0.2
          ? "#22c55e"
          : "#3b82f6"

      L.circle([point.lat, point.lng], {
        color: color,
        fillColor: color,
        fillOpacity: opacity,
        radius: radius,
        weight: 0,
      }).addTo(map)

      // Add label
      const divIcon = L.divIcon({
        className: "heatmap-label",
        html: `<div style="
          background: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          white-space: nowrap;
        ">${Math.round(point.intensity * 100)}</div>`,
        iconSize: [0, 0],
      })

      L.marker([point.lat, point.lng], { icon: divIcon }).addTo(map)
    })

    // Cleanup
    return () => {
      map.remove()
    }
  }, [center, zoom, heatmapData])

  return <div id="heatmap" className={className || "h-full w-full"} />
}
