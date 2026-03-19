'use client';

import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import { CITY_COORDS, matchCity } from '@/lib/cities';
import type { Meeting } from '@/types';

interface Props {
  meetings: Meeting[];
  nextCity?: string;
}

export default function MapInner({ meetings, nextCity }: Props) {
  const cityCounts: Record<string, number> = {};
  for (const meeting of meetings) {
    const city = matchCity(meeting.city);
    if (city) {
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
  }

  const markers = Object.entries(cityCounts)
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
      markers.push({
        city: matched,
        coords: CITY_COORDS[matched],
        count: 0,
        isNext: true,
      });
    }
  }

  const allCoords = markers.map((marker) => marker.coords);
  const center: [number, number] =
    allCoords.length > 0
      ? [
          allCoords.reduce((sum, coords) => sum + coords[0], 0) / allCoords.length,
          allCoords.reduce((sum, coords) => sum + coords[1], 0) / allCoords.length,
        ]
      : [35, 110];

  const lines: [number, number][][] = [];
  for (let index = 1; index < meetings.length; index += 1) {
    const a = matchCity(meetings[index - 1].city);
    const b = matchCity(meetings[index].city);
    if (a && b && CITY_COORDS[a] && CITY_COORDS[b]) {
      lines.push([CITY_COORDS[a], CITY_COORDS[b]]);
    }
  }

  return (
    <MapContainer center={center} zoom={5} className="h-full w-full" scrollWheelZoom={false}>
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
