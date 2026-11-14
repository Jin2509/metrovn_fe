import { incidentsApi, type IncidentResponse, type IncidentSeverity } from "@/lib/api";
import { useSyncedQuery } from "@/lib/query-sync";
import { incidentsStore, type StationIncident } from "@/stores/incidents";

export const INCIDENTS_KEY = ["incidents"] as const;
/** Đủ cho màn hình theo dõi; backend phân trang mặc định 20. */
const FETCH_SIZE = 200;

const SEVERITY_RANK: Record<IncidentSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const toIncident = (i: IncidentResponse): StationIncident => ({
  id: String(i.id),
  stationId: String(i.stationId),
  stationName: i.stationName,
  type: i.type,
  severity: i.severity,
  status: i.status,
  reportedBy: i.reportedBy,
  description: i.description,
  hasImage: i.hasImage,
  handledBy: i.handledBy,
  resolution: i.resolution,
  acceptedAt: i.acceptedAt,
  resolvedAt: i.resolvedAt,
  createdAt: i.createdAt,
});

/** Sự cố mới nhất, đồng bộ vào `incidentsStore`. Cần quyền INCIDENT_MANAGE. */
export function useIncidentsData(enabled = true) {
  return useSyncedQuery({
    queryKey: INCIDENTS_KEY,
    queryFn: () => incidentsApi.list({ size: FETCH_SIZE }),
    store: incidentsStore,
    map: (page) => page.content.map(toIncident),
    enabled,
  });
}

export const isOpen = (incident: Pick<StationIncident, "status">) => incident.status !== "RESOLVED";
export const isUrgent = (incident: Pick<StationIncident, "severity">) =>
  incident.severity === "CRITICAL" || incident.severity === "HIGH";

/** Việc gấp xem trước: mức độ nặng trước, cùng mức thì sự cố báo sớm hơn trước. */
export function sortIncidents(list: StationIncident[]) {
  return [...list].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

export type IncidentFilter = {
  tab: "OPEN" | "RESOLVED";
  severity: "ALL" | IncidentSeverity;
  stationId: "ALL" | string;
  search: string;
};

export function filterIncidents(list: StationIncident[], filter: IncidentFilter) {
  const term = filter.search.trim().toLowerCase();
  return list.filter(
    (incident) =>
      isOpen(incident) === (filter.tab === "OPEN") &&
      (filter.severity === "ALL" || incident.severity === filter.severity) &&
      (filter.stationId === "ALL" || incident.stationId === filter.stationId) &&
      (!term ||
        [incident.id, incident.description, incident.stationName]
          .join(" ")
          .toLowerCase()
          .includes(term)),
  );
}

export function incidentStats(list: StationIncident[]) {
  const open = list.filter(isOpen);
  return {
    open: open.length,
    fresh: open.filter((incident) => incident.status === "NEW").length,
    urgent: open.filter(isUrgent).length,
    resolved: list.length - open.length,
  };
}
