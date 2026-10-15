import "leaflet/dist/leaflet.css";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import { busStops, lines, lineStations, stations, stopsForStation } from "@/mocks/metro";

type Props = {
  showBus?: boolean | undefined;
  visibleLines?: string[] | undefined;
  focusStationId?: string | null | undefined;
  highlightRoute?: string | null | undefined;
  onSelectStation?: ((id: string) => void) | undefined;
  height?: number | string | undefined;
};

function Focus({ id }: { id?: string | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    const s = stations.find((x) => x.id === id);
    if (s) map.flyTo([s.lat, s.lng], 16, { duration: 0.8 });
  }, [id, map]);
  return null;
}

export default function MetroMap({
  showBus = true,
  visibleLines = ["L1", "L2"],
  focusStationId,
  highlightRoute,
  onSelectStation,
  height = 520,
}: Props) {
  const busColor = "oklch(0.65 0.17 140)";
  return (
    <MapContainer
      center={[10.815, 106.73]}
      zoom={12}
      style={{ height, width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Focus id={focusStationId} />
      {lines
        .filter((l) => visibleLines.includes(l.id))
        .map((l) => (
          <Polyline
            key={l.id}
            positions={lineStations(l.id).map((s) => [s.lat, s.lng] as [number, number])}
            pathOptions={{
              color: l.colorHex,
              weight: 6,
              opacity: 0.85,
              dashArray: l.status === "PLANNED" ? "10 8" : undefined,
            }}
          />
        ))}
      {showBus &&
        busStops
          .filter((b) => !highlightRoute || b.routes.includes(highlightRoute))
          .map((b) => {
            const s = stations.find((x) => x.id === b.stationId)!;
            return (
              <Polyline
                key={`w${b.id}`}
                positions={[
                  [b.lat, b.lng],
                  [s.lat, s.lng],
                ]}
                pathOptions={{ color: busColor, weight: 2, dashArray: "3 5" }}
              />
            );
          })}
      {showBus &&
        busStops
          .filter((b) => !highlightRoute || b.routes.includes(highlightRoute))
          .map((b) => (
            <CircleMarker
              key={b.id}
              center={[b.lat, b.lng]}
              radius={5}
              pathOptions={{ color: busColor, fillColor: busColor, fillOpacity: 1 }}
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
      {stations
        .filter((s) => s.lineIds.some((l) => visibleLines.includes(l)))
        .map((s) => {
          const color = lines.find((l) => l.id === s.lineIds[0])!.colorHex;
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={s.interchange ? 10 : 7}
              pathOptions={{ color, weight: 3, fillColor: "#ffffff", fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelectStation?.(s.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {s.name}
              </Tooltip>
              <Popup>
                <strong>Ga {s.name}</strong>
                {s.interchange && " · ga chuyển tuyến"}
                <br />
                {s.status === "ACTIVE"
                  ? `Lưu lượng: ${s.dailyFlow.toLocaleString("vi-VN")} lượt/ngày`
                  : "Đang quy hoạch"}
                <br />
                Trạm buýt kết nối: {stopsForStation(s.id).length}
              </Popup>
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
}
