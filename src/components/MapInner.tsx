'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { CITY_COORDS, matchCity } from '@/lib/cities';
import type { Meeting } from '@/types';

interface Props {
  meetings: Meeting[];
  nextCity?: string;
}

interface MapMarker {
  city: string;
  coords: [number, number];
  count: number;
  isNext: boolean;
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coords.length === 0) {
      return;
    }

    if (coords.length === 1) {
      map.setView(coords[0], 5);
      return;
    }

    map.fitBounds(coords, {
      padding: [24, 24],
      maxZoom: 6,
    });
  }, [coords, map]);

  return null;
}

export default function MapInner({ meetings, nextCity }: Props) {
  const { markers, allCoords, center, lines } = useMemo(() => {
    const cityCounts: Record<string, number> = {};
    for (const meeting of meetings) {
      const city = matchCity(meeting.city);
      if (city) {
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
    }

    const nextMarkers: MapMarker[] = Object.entries(cityCounts)
      .filter(([city]) => CITY_COORDS[city])
      .map(([city, count]) => ({
        city,
        coords: CITY_COORDS[city] as [number, number],
        count,
        isNext: false,
      }));

    if (nextCity) {
      const matched = matchCity(nextCity);
      if (matched && CITY_COORDS[matched] && !cityCounts[matched]) {
        nextMarkers.push({
          city: matched,
          coords: CITY_COORDS[matched],
          count: 0,
          isNext: true,
        });
      }
    }

    const nextAllCoords = nextMarkers.map((marker) => marker.coords);
    const nextCenter: [number, number] =
      nextAllCoords.length > 0
        ? [
            nextAllCoords.reduce((sum, coords) => sum + coords[0], 0) / nextAllCoords.length,
            nextAllCoords.reduce((sum, coords) => sum + coords[1], 0) / nextAllCoords.length,
          ]
        : [35, 110];

    const nextLines: [number, number][][] = [];
    for (let index = 1; index < meetings.length; index += 1) {
      const a = matchCity(meetings[index - 1].city);
      const b = matchCity(meetings[index].city);
      if (a && b && CITY_COORDS[a] && CITY_COORDS[b]) {
        nextLines.push([CITY_COORDS[a], CITY_COORDS[b]]);
      }
    }

    return {
      markers: nextMarkers,
      allCoords: nextAllCoords,
      center: nextCenter,
      lines: nextLines,
    };
  }, [meetings, nextCity]);

  return (
    <MapContainer center={center} zoom={5} className="h-full w-full" scrollWheelZoom={false}>
      <FitBounds coords={allCoords} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {lines.map((line, index) => (
        <Polyline
          key={index}
          positions={line}
          color="#d4a574"
          weight={2}
          dashArray="6,4"
          opacity={0.6}
        />
      ))}
      {markers.map((marker) => (
        <CircleMarker
          key={marker.city}
          center={marker.coords}
          radius={marker.isNext ? 8 : Math.min(6 + marker.count * 2, 14)}
          pathOptions={{
            color: marker.isNext ? '#d4a574' : '#c47d5a',
            fillColor: marker.isNext ? '#d4a574' : '#c47d5a',
            fillOpacity: 0.7,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <span className="font-serif">
              {marker.city} {marker.isNext ? '(即将)' : `${marker.count}次`}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
