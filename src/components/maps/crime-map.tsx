"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { OSM_ATTRIBUTION, OSM_TILES } from "@/components/maps/marker-icon";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CrimeType } from "@/generated/prisma/enums";
import { CRIME_TYPE_COLORS, CRIME_TYPE_LABELS, CRIME_TYPES } from "@/lib/report-meta";
import type { MapPoint } from "@/server/reports/queries";

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

const LEGEND: { label: string; color: string }[] = [
  { label: "Theft", color: CRIME_TYPE_COLORS.THEFT },
  { label: "Assault", color: CRIME_TYPE_COLORS.ASSAULT },
  { label: "Fraud", color: CRIME_TYPE_COLORS.FRAUD },
  { label: "Vandalism", color: CRIME_TYPE_COLORS.VANDALISM },
  { label: "Burglary", color: CRIME_TYPE_COLORS.BURGLARY },
  { label: "Other", color: CRIME_TYPE_COLORS.OTHER },
];

// Only numbers and fixed colours are interpolated here, never report text.
function createMarkerIcon(color: string, size: number) {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    className: "marker-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function HeatmapLayer({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.heatLayer(
      points.map((point): [number, number, number] => [point.lat, point.lng, 1]),
      {
        radius: 40,
        blur: 30,
        maxZoom: 1,
        gradient: {
          0.1: "#2b83ba",
          0.3: "#abdda4",
          0.5: "#ffffbf",
          0.7: "#fdae61",
          1.0: "#b91c1c",
        },
      },
    ).addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);
  return null;
}

function ClusterLayer({
  points,
  markerSize,
  onSelect,
}: {
  points: MapPoint[];
  markerSize: number;
  onSelect: (point: MapPoint) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          html: `<span>${cluster.getChildCount()}</span>`,
          className: "custom-marker-cluster",
          iconSize: L.point(40, 40, true),
        }),
    });
    for (const point of points) {
      const marker = L.marker([point.lat, point.lng], {
        icon: createMarkerIcon(CRIME_TYPE_COLORS[point.type], markerSize),
      });
      marker.on("click", () => onSelect(point));
      clusterGroup.addLayer(marker);
    }
    map.addLayer(clusterGroup);
    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, points, markerSize, onSelect]);
  return null;
}

type Summary = {
  id: string;
  title: string;
  description: string;
  crimeType: string;
  incidentAt: string;
};

/**
 * Popup body. The map only has id/lat/lng/type per report, so the details are
 * fetched when a marker is opened. Rendered with a `key` per report, so each
 * popup starts in the loading state.
 */
function ReportPopupContent({ id, onLoaded }: { id: string; onLoaded: () => void }) {
  const [state, setState] = useState<Summary | "loading" | "error">("loading");

  // The popup was laid out around the loading text; let Leaflet re-measure
  // and re-pan once the real content is in.
  useEffect(() => {
    if (state !== "loading") onLoaded();
  }, [state, onLoaded]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/reports/${id}/summary`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<Summary>) : Promise.reject()))
      .then(setState)
      .catch(() => {
        if (!controller.signal.aborted) setState("error");
      });
    return () => controller.abort();
  }, [id]);

  if (state === "loading") {
    return <p className="w-[250px] text-sm text-muted-foreground">Loading…</p>;
  }
  if (state === "error") {
    return <p className="w-[250px] text-sm text-destructive">This report could not be loaded.</p>;
  }
  return (
    <div className="w-[250px] space-y-1">
      <h3 className="font-bold text-base">{state.title}</h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">{state.crimeType}</span>
        <span>•</span>
        <span>{state.incidentAt}</span>
      </div>
      <p className="text-sm line-clamp-2 my-2">{state.description}</p>
      <Link
        href={`/reports/${state.id}`}
        className="text-primary hover:underline text-sm font-medium"
        prefetch={false}
      >
        View Details →
      </Link>
    </div>
  );
}

export default function CrimeMap({ points }: { points: MapPoint[] }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedType, setSelectedType] = useState<CrimeType | "all">("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [markerSize, setMarkerSize] = useState(32);
  const [mapMode, setMapMode] = useState<"standard" | "satellite">("standard");
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const popupRef = useRef<L.Popup>(null);
  const refreshPopup = useCallback(() => popupRef.current?.update(), []);

  // Filter buttons for the types that actually occur, "Other" last.
  const availableTypes = useMemo(() => {
    const present = new Set(points.map((point) => point.type));
    return CRIME_TYPES.filter((type) => present.has(type));
  }, [points]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
      () => {
        // Without permission the map centres on the reports instead.
      },
    );
  }, []);

  const filteredPoints = useMemo(
    () => (selectedType === "all" ? points : points.filter((point) => point.type === selectedType)),
    [points, selectedType],
  );

  const center = useMemo<[number, number]>(() => {
    if (userLocation) return userLocation;
    if (filteredPoints.length > 0) return [filteredPoints[0].lat, filteredPoints[0].lng];
    return INDIA_CENTER;
  }, [userLocation, filteredPoints]);

  return (
    <div className="relative h-full">
      <div className="absolute top-4 right-4 z-[1000] space-y-3 bg-background/90 p-4 rounded-lg shadow-lg border max-w-[min(24rem,calc(100%-2rem))]">
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Crime Type</h3>
          <ToggleGroup
            value={selectedType}
            onValueChange={(value) => {
              setSelected(null);
              setSelectedType(value === "all" ? "all" : (value as CrimeType));
            }}
            className="flex flex-wrap justify-start gap-1"
          >
            <ToggleGroupItem value="all" className="text-xs h-8 px-2">
              All Types
            </ToggleGroupItem>
            {availableTypes.map((type) => (
              <ToggleGroupItem key={type} value={type} className="text-xs h-8 px-2">
                {CRIME_TYPE_LABELS[type]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Map Mode</h3>
          <ToggleGroup
            value={mapMode}
            onValueChange={(value) => setMapMode(value === "satellite" ? "satellite" : "standard")}
            className="flex gap-1"
          >
            <ToggleGroupItem value="standard" className="text-xs h-8">
              Standard
            </ToggleGroupItem>
            <ToggleGroupItem value="satellite" className="text-xs h-8">
              Satellite
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">View Options</h3>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={showHeatmap ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (!showHeatmap) {
                  setShowClusters(false);
                  setSelected(null);
                }
                setShowHeatmap(!showHeatmap);
              }}
              className="text-xs h-8"
            >
              {showHeatmap ? "Hide" : "Heatmap"}
            </Button>
            <Button
              variant={showClusters ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (!showClusters) setShowHeatmap(false);
                setShowClusters(!showClusters);
              }}
              className="text-xs h-8"
            >
              {showClusters ? "Hide" : "Clusters"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm">Marker Size</h3>
            <span className="text-xs text-muted-foreground">{markerSize}px</span>
          </div>
          <Slider
            value={[markerSize]}
            onValueChange={([value]) => setMarkerSize(value)}
            min={20}
            max={50}
            step={2}
            className="w-full"
            aria-label="Marker size"
          />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 p-3 rounded-lg shadow-lg border">
        <h3 className="font-medium text-sm mb-2">Legend</h3>
        <div className="space-y-2">
          {LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        {mapMode === "standard" ? (
          <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILES} />
        ) : (
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {showHeatmap && <HeatmapLayer points={filteredPoints} />}

        {!showHeatmap && showClusters && (
          <ClusterLayer points={filteredPoints} markerSize={markerSize} onSelect={setSelected} />
        )}

        {!showHeatmap &&
          !showClusters &&
          filteredPoints.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={createMarkerIcon(CRIME_TYPE_COLORS[point.type], markerSize)}
              eventHandlers={{ click: () => setSelected(point) }}
            />
          ))}

        {selected && !showHeatmap && (
          <Popup
            key={selected.id}
            ref={popupRef}
            position={[selected.lat, selected.lng]}
            offset={[0, -markerSize]}
            eventHandlers={{
              // Closing this popup clears the selection, unless another
              // marker has been selected in the meantime.
              remove: () =>
                setSelected((current) => (current?.id === selected.id ? null : current)),
            }}
          >
            <ReportPopupContent id={selected.id} onLoaded={refreshPopup} />
          </Popup>
        )}

        <RecenterMap lat={center[0]} lng={center[1]} />
      </MapContainer>
    </div>
  );
}
