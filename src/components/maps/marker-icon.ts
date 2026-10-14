import L from "leaflet";

/** Leaflet's default pin, served from /public (its bundled URLs break under bundlers). */
export const pinIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
