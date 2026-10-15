import "leaflet/dist/leaflet.css";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect } from "react";
import { busStops } from "@/mocks/metro";
import { useNetwork } from "@/mocks/network";
import { poiCats, type Poi, type PoiCat, type Pt } from "@/lib/geo";

export type Leg = { coords: [number, number][]; kind: "walk" | "metro" | "road"; color?: string };
type Props = {
  focus?: { lat: number; lng: number; zoom?: number } | null;
  pois: Poi[];
  poiFilter: PoiCat[];
  legs: Leg[];
  origin?: Pt | null;
  dest?: Pt | null;
  draft?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
  onSelectStation?: (id: string) => void;
  onPoiRoute?: (p: Poi) => void;
};

function Fly({ focus }: { focus: Props["focus"] }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], focus.zoom ?? 16, { duration: 0.8 });
  }, [focus, map]);
  return null;
}
function FitLegs({ legs }: { legs: Leg[] }) {
  const map = useMap();
  useEffect(() => {
    const all = legs.flatMap((l) => l.coords);
    if (all.length > 1) map.fitBounds(all, { padding: [40, 40] });
  }, [legs, map]);
  return null;
}
function Clicks({ on }: { on?: ((lat: number, lng: number) => void) | undefined }) {
  useMapEvents({ click: (e) => on?.(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function ExplorerMap({
  focus,
  pois,
  poiFilter,
  legs,
  origin,
  dest,
  draft,
  onMapClick,
  onSelectStation,
  onPoiRoute,
}: Props) {
  const { stations, lines, pathOf } = useNetwork();
  return (
    <MapContainer
      center={[10.81, 106.72]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Fly focus={focus} />
      <FitLegs legs={legs} />
      <Clicks on={onMapClick} />
      {lines.map((l) => (
        <Polyline
          key={l.id}
          positions={pathOf(l.id).map((s) => [s.lat, s.lng] as [number, number])}
          pathOptions={{
            color: l.colorHex,
            weight: 6,
            opacity: legs.length ? 0.35 : 0.85,
            dashArray: l.status === "PLANNED" ? "10 8" : undefined,
          }}
        />
      ))}
      {legs.map((l, i) => (
        <Polyline
          key={i}
          positions={l.coords}
          pathOptions={{
            color: l.color ?? (l.kind === "walk" ? "#1c7ed6" : "#1864ab"),
            weight: l.kind === "metro" ? 8 : 5,
            dashArray: l.kind === "walk" ? "2 8" : undefined,
            lineCap: "round",
          }}
        />
      ))}
      {busStops.map((b) => (
        <CircleMarker
          key={b.id}
          center={[b.lat, b.lng]}
          radius={5}
          pathOptions={{ color: "#2f9e44", fillColor: "#2f9e44", fillOpacity: 1 }}
        >
          <Popup>
            <strong>🚌 {b.name}</strong>
            <br />
            Tuyến: {b.routes.join(", ")}
            <br />
            Đi bộ ~{b.walkMinutes} phút tới ga
          </Popup>
        </CircleMarker>
      ))}
      {pois
        .filter((p) => poiFilter.includes(p.cat))
        .map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={6}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: poiCats[p.cat].color,
              fillOpacity: 0.95,
            }}
          >
            <Tooltip>
              {poiCats[p.cat].icon} {p.name}
            </Tooltip>
            <Popup>
              <strong>
                {poiCats[p.cat].icon} {p.name}
              </strong>
              <br />
              {poiCats[p.cat].label}
              <br />
              <button
                style={{ marginTop: 6, textDecoration: "underline" }}
                onClick={() => onPoiRoute?.(p)}
              >
                Chỉ đường tới đây
              </button>
            </Popup>
          </CircleMarker>
        ))}
      {stations
        .filter((s) => s.lineIds.length)
        .map((s) => {
          const color = lines.find((l) => l.id === s.lineIds[0])?.colorHex ?? "#555";
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={s.interchange ? 10 : 7}
              pathOptions={{ color, weight: 3, fillColor: "#ffffff", fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelectStation?.(s.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                Ga {s.name}
              </Tooltip>
            </CircleMarker>
          );
        })}
      {origin && (
        <CircleMarker
          center={[origin.lat, origin.lng]}
          radius={9}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#2b8a3e", fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top">
            A
          </Tooltip>
        </CircleMarker>
      )}
      {dest && (
        <CircleMarker
          center={[dest.lat, dest.lng]}
          radius={9}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#c92a2a", fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top">
            B
          </Tooltip>
        </CircleMarker>
      )}
      {draft && (
        <CircleMarker
          center={[draft.lat, draft.lng]}
          radius={10}
          pathOptions={{
            color: "#000",
            weight: 2,
            dashArray: "3 3",
            fillColor: "#ffd43b",
            fillOpacity: 0.9,
          }}
        >
          <Tooltip permanent direction="top">
            Ga mới
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
