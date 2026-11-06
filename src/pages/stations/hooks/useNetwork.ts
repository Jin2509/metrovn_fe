import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { MapNetwork } from "@/components/metro-map";
import {
  apiErrorMessage,
  linesApi,
  stationsApi,
  type LineResponse,
  type LineStationResponse,
  type StationResponse,
} from "@/lib/api";
import type { Station } from "@/mocks/metro";

/** Mọi dữ liệu tuyến/ga đều nằm dưới khoá này: invalidate khoá gốc là tải lại toàn bộ. */
export const NETWORK_KEY = ["network"] as const;
export const networkKeys = {
  lines: [...NETWORK_KEY, "lines"] as const,
  stations: [...NETWORK_KEY, "stations"] as const,
  lineStations: (lineId: number) => [...NETWORK_KEY, "line-stations", lineId] as const,
  lineTransfers: (lineId: number) => [...NETWORK_KEY, "line-transfers", lineId] as const,
  stationLines: (stationId: number) => [...NETWORK_KEY, "station-lines", stationId] as const,
  stationConnections: (stationId: number) =>
    [...NETWORK_KEY, "station-connections", stationId] as const,
};

const FALLBACK_COLOR = "#64748b";
export const lineColor = (line: Pick<LineResponse, "colorHex"> | undefined) =>
  line?.colorHex || FALLBACK_COLOR;

/** Chuyển dữ liệu API sang dạng bản đồ đang dùng (id dạng chuỗi). */
export function toMapNetwork(
  lines: LineResponse[],
  stations: StationResponse[],
  lineStations: Record<number, LineStationResponse[]>,
): MapNetwork {
  const lineIdsOf = new Map<number, string[]>();
  for (const line of lines)
    for (const row of lineStations[line.id] ?? [])
      lineIdsOf.set(row.station.id, [...(lineIdsOf.get(row.station.id) ?? []), String(line.id)]);
  const toStation = (s: StationResponse, order = 0): Station => ({
    id: String(s.id),
    code: s.code,
    name: s.nameStation,
    address: s.address ?? "",
    district: s.district ?? "",
    lineIds: lineIdsOf.get(s.id) ?? [],
    lat: s.latitude,
    lng: s.longitude,
    order,
    interchange: s.isInterchange,
    status: s.status,
    dailyFlow: 0,
  });
  return {
    lines: lines.map((l) => ({
      id: String(l.id),
      code: l.code,
      name: l.nameLine,
      colorHex: lineColor(l),
      status: l.status === "ACTIVE" ? "ACTIVE" : "PLANNED",
    })),
    stations: stations.map((s) => toStation(s)),
    paths: Object.fromEntries(
      lines.map((l) => [
        String(l.id),
        (lineStations[l.id] ?? []).map((row) => toStation(row.station, row.stationOrder)),
      ]),
    ),
  };
}

/**
 * Toàn bộ tuyến, ga và danh sách ga của từng tuyến (để biết ga thuộc tuyến nào và vẽ bản đồ).
 * Số tuyến ít nên tải danh sách ga của mọi tuyến cùng lúc.
 */
export function useNetwork() {
  const queryClient = useQueryClient();
  const linesQuery = useQuery({ queryKey: networkKeys.lines, queryFn: linesApi.all, retry: false });
  const stationsQuery = useQuery({
    queryKey: networkKeys.stations,
    queryFn: stationsApi.all,
    retry: false,
  });
  const lines = useMemo(
    () => [...(linesQuery.data ?? [])].sort((a, b) => a.code.localeCompare(b.code)),
    [linesQuery.data],
  );
  const lineStationQueries = useQueries({
    queries: lines.map((line) => ({
      queryKey: networkKeys.lineStations(line.id),
      queryFn: () => linesApi.stations(line.id),
      retry: false,
    })),
  });
  const lineStationData = lineStationQueries.map((q) => q.data);
  // useQueries trả mảng mới mỗi lần render: chỉ tính lại khi dữ liệu thật sự đổi.
  const lineStationsKey = lineStationQueries.map((q) => q.dataUpdatedAt).join(",");
  const lineStations = useMemo(() => {
    const byLine: Record<number, LineStationResponse[]> = {};
    lines.forEach((line, i) => (byLine[line.id] = lineStationData[i] ?? []));
    return byLine;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, lineStationsKey]);
  const stations = useMemo(() => stationsQuery.data ?? [], [stationsQuery.data]);

  const linesByStation = useMemo(() => {
    const map = new Map<number, LineResponse[]>();
    for (const line of lines)
      for (const row of lineStations[line.id] ?? [])
        map.set(row.station.id, [...(map.get(row.station.id) ?? []), line]);
    return map;
  }, [lines, lineStations]);

  const mapNetwork = useMemo(
    () => toMapNetwork(lines, stations, lineStations),
    [lines, stations, lineStations],
  );

  const error =
    linesQuery.error ?? stationsQuery.error ?? lineStationQueries.find((q) => q.error)?.error;

  return {
    lines,
    stations,
    lineStations,
    linesByStation,
    mapNetwork,
    loading: linesQuery.isPending || stationsQuery.isPending,
    loadError: error ? apiErrorMessage(error) : "",
    reload: () => queryClient.invalidateQueries({ queryKey: NETWORK_KEY }),
  };
}
