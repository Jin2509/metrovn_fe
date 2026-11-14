import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiErrorMessage, busApi, type BusStop as ApiBusStop } from "@/lib/api";
import { replaceBusData, type BusStop, type Station } from "@/stores/metro";

const BUS_KEY = ["bus"] as const;
/** Bán kính tìm trạm quanh ga (km) và số trạm tối đa mỗi ga. */
const RADIUS_KM = 0.5;
const LIMIT = 10;
/** Tốc độ đi bộ ~80 m/phút để ước thời gian đi bộ từ ga ra trạm. */
const WALK_M_PER_MIN = 80;

/** Gộp các dòng (trạm × tuyến) backend trả về thành từng trạm kèm danh sách tuyến. */
export function toBusStops(stationId: string, rows: ApiBusStop[]): BusStop[] {
  const byStop = new Map<string, BusStop>();
  for (const row of rows) {
    const stop = byStop.get(row.stopId) ?? {
      id: `${stationId}:${row.stopId}`,
      name: row.name,
      stationId,
      lat: row.latitude,
      lng: row.longitude,
      walkMinutes: Math.max(1, Math.round((row.distanceMeters ?? 0) / WALK_M_PER_MIN)),
      routes: [],
    };
    if (row.routeCode && !stop.routes.includes(row.routeCode)) stop.routes.push(row.routeCode);
    byStop.set(row.stopId, stop);
  }
  return [...byStop.values()];
}

/** Tuyến buýt và trạm buýt quanh từng ga (dữ liệu bên ngoài, chỉ tải khi bật lớp xe buýt). */
export function useBusData(stations: Station[], enabled: boolean) {
  const routes = useQuery({
    queryKey: [...BUS_KEY, "routes"],
    queryFn: busApi.routes,
    enabled,
    retry: false,
    staleTime: 10 * 60_000,
  });
  const stops = useQueries({
    queries: stations.map((station) => ({
      queryKey: [...BUS_KEY, "station", station.id],
      queryFn: () => busApi.forStation(Number(station.id), RADIUS_KM, LIMIT),
      enabled,
      retry: false,
      staleTime: 10 * 60_000,
    })),
  });
  const key = [routes.dataUpdatedAt, ...stops.map((q) => q.dataUpdatedAt)].join(",");
  useEffect(() => {
    if (!routes.data) return;
    replaceBusData(
      routes.data.map((r) => ({ code: r.code, name: r.name, description: r.description ?? "" })),
      stations.flatMap((station, i) => toBusStops(station.id, stops[i]?.data ?? [])),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const error = routes.error ?? stops.find((q) => q.error)?.error;
  return {
    loading: enabled && (routes.isPending || stops.some((q) => q.isPending)),
    error: error ? apiErrorMessage(error) : "",
  };
}
