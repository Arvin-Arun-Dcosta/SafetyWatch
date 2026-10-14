"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { OSM_ATTRIBUTION, OSM_TILES, pinIcon } from "@/components/maps/marker-icon";

// Thane, India: where the map opens before a location is known.
const DEFAULT_CENTER: [number, number] = [19.2183, 72.9781];
const DEFAULT_ZOOM = 12;
const PICKED_ZOOM = 16;

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => onPick(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

/** Keeps the view on the pin when it is moved from outside (geolocation, typed address). */
function FollowPosition({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), PICKED_ZOOM), { duration: 0.5 });
  }, [map, lat, lng]);
  return null;
}

/** Interactive map for choosing where an incident happened. */
export default function LocationPicker({
  position,
  onPick,
}: {
  position: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={position ? [position.lat, position.lng] : DEFAULT_CENTER}
      zoom={position ? PICKED_ZOOM : DEFAULT_ZOOM}
      scrollWheelZoom
      style={{ height: "400px", width: "100%", zIndex: 1 }}
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILES} />
      <ClickToPick onPick={onPick} />
      <FollowPosition position={position} />
      {position && <Marker position={[position.lat, position.lng]} icon={pinIcon} />}
    </MapContainer>
  );
}
