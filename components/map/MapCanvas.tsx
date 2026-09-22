"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "tabellone-map-pin",
  html: `<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;background:#ea580c;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
});

type MapCanvasProps = {
  latitude?: number | null;
  longitude?: number | null;
  interactive?: boolean;
  onSelect?: (lat: number, lng: number) => void;
};

export default function MapCanvas({
  latitude,
  longitude,
  interactive = false,
  onSelect,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasPoint = latitude != null && longitude != null;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(
      hasPoint ? [latitude, longitude] : [15.3647, 75.124],
      hasPoint ? 15 : 6
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    if (hasPoint) {
      markerRef.current = L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);
    }

    if (interactive) {
      map.on("click", (event: L.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
        }
        onSelect?.(lat, lng);
      });
    }

    requestAnimationFrame(() => map.invalidateSize());
    const timer = window.setTimeout(() => map.invalidateSize(), 250);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null) return;
    const zoom = map.getZoom() < 14 ? 16 : map.getZoom();
    map.flyTo([latitude, longitude], zoom, { duration: 0.6 });
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl"
      style={{ height: 380 }}
    />
  );
}
