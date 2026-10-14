"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { OSM_ATTRIBUTION, OSM_TILES, pinIcon } from "@/components/maps/marker-icon";

/** Read-only map showing where one report happened. */
export default function ReportLocationMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 1 }}
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILES} />
      <Marker position={[lat, lng]} icon={pinIcon} />
    </MapContainer>
  );
}
