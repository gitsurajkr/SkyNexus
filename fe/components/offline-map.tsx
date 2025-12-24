"use client";

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SensorData } from '@/lib/sensorData';

// Fix Leaflet's dragEvent error by ensuring it only runs client-side
if (typeof window !== 'undefined') {
  // @ts-expect-error - Leaflet workaround for dragEvent
  window.dragEvent = null;
}

interface OfflineMapProps {
  data: SensorData[];
  currentIndex: number;
}

const defaultCenter: [number, number] = [28.5, 77.2];

// Component to update map view when current position changes
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    const safeCenter = Array.isArray(center) &&
      typeof center[0] === 'number' && !isNaN(center[0]) &&
      typeof center[1] === 'number' && !isNaN(center[1])
      ? center
      : defaultCenter;
    map.setView(safeCenter, zoom);
  }, [center, zoom, map]);
  return null;
}


export default function OfflineMap({ data, currentIndex }: OfflineMapProps) {
  // Calculate flight path and current position from data
  const { flightPath, currentPosition } = useMemo(() => {
    if (!data || data.length === 0 || currentIndex < 0) {
      return { flightPath: [], currentPosition: null };
    }

    // Build path but filter out any points without valid numeric GPS coordinates
    const raw = data.slice(0, currentIndex + 1).map(point => [
      point.GPS_LATITUDE,
      point.GPS_LONGITUDE,
    ])

    const isValid = (p: unknown): p is [number, number] =>
      Array.isArray(p) && typeof p[0] === 'number' && !isNaN(p[0]) && typeof p[1] === 'number' && !isNaN(p[1])

    const path: [number, number][] = raw.filter(isValid) as [number, number][]

    const current: [number, number] | null = data[currentIndex] && isValid([data[currentIndex].GPS_LATITUDE, data[currentIndex].GPS_LONGITUDE])
      ? [data[currentIndex].GPS_LATITUDE, data[currentIndex].GPS_LONGITUDE]
      : null

    return { flightPath: path, currentPosition: current }
  }, [data, currentIndex]);

  // Create custom CanSat icon
  const cansatIcon = useMemo(() => {
    return L.icon({
      iconUrl: '/cansat-icon.svg',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24],
    });
  }, []);

  // Create launch point icon
  const launchIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-launch-icon',
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#10B981" opacity="0.3"/>
          <circle cx="16" cy="16" r="10" fill="#10B981" stroke="#FFFFFF" stroke-width="3"/>
          <circle cx="16" cy="16" r="4" fill="#FFFFFF"/>
        </svg>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  // Ensure mapCenter is always valid latitude/longitude
  const isValidLatLng = (pos: unknown): pos is [number, number] => Array.isArray(pos) &&
    typeof pos[0] === 'number' && !isNaN(pos[0]) &&
    typeof pos[1] === 'number' && !isNaN(pos[1]);
  const mapCenter: [number, number] = isValidLatLng(currentPosition) ? currentPosition : defaultCenter;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        {/* OpenStreetMap tiles - can be cached for offline use */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Satellite/Hybrid view alternative - Esri World Imagery */}
        {/* Uncomment to use satellite view:
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        */}

        {/* Flight path */}
        {flightPath.length > 1 && (
          <Polyline
            positions={flightPath}
            pathOptions={{
              color: '#3B82F6',
              weight: 3,
              opacity: 0.8,
            }}
          />
        )}

        {/* Current position */}
        {isValidLatLng(currentPosition) && (
          <Marker
            position={currentPosition}
            icon={cansatIcon}
            title={`CanSat - Alt: ${typeof data[currentIndex]?.ALTITUDE === 'number' ? data[currentIndex].ALTITUDE.toFixed(0) : 'N/A'}m | State: ${data[currentIndex]?.STATE || 'UNKNOWN'}`}
          />
        )}

        {/* Launch point */}
        {flightPath.length > 0 && isValidLatLng(flightPath[0]) && (
          <Marker
            position={flightPath[0]}
            icon={launchIcon}
            title="Launch Point"
          />
        )}

        {currentPosition && <MapUpdater center={currentPosition} zoom={14} />}
      </MapContainer>
    </div>
  );
}