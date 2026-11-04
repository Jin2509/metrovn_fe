import { getActorName } from "@/lib/auth/session.store";
import { stationName } from "@/lib/network";
import { logAction } from "@/mocks/admin";
import type { AnnouncementSeverity } from "@/mocks/announcements";
import {
  incidentsStore,
  type IncidentEvent,
  type IncidentSeverity,
  type IncidentStatus,
  type StationIncident,
} from "@/mocks/incidents";
import { INCIDENT_PUBLIC_NAME } from "@/pages/incidents/incidents.constants";
import { emptyDraft, endNow, publish } from "@/pages/notifications/notifications.service";

const SEVERITY_RANK: Record<IncidentSeverity, number> = { EMERGENCY: 0, OPERATIONS: 1, MINOR: 2 };
const ANNOUNCEMENT_SEVERITY: Record<IncidentSeverity, AnnouncementSeverity> = {
  EMERGENCY: "CRITICAL",
  OPERATIONS: "WARNING",
  MINOR: "INFO",
};

export const isOpen = (incident: Pick<StationIncident, "status">) => incident.status !== "RESOLVED";

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
        [incident.id, incident.description, incident.reporterName, stationName(incident.stationId)]
          .join(" ")
          .toLowerCase()
          .includes(term)),
  );
}

export function incidentStats(list: StationIncident[]) {
  const open = list.filter(isOpen);
  return {
    open: open.length,
    emergency: open.filter((incident) => incident.severity === "EMERGENCY").length,
    pendingPublication: open.filter((incident) => incident.publication === "PENDING").length,
    published: open.filter((incident) => incident.publication === "PUBLISHED").length,
  };
}

/** Nội dung hành khách thấy: chỉ tên ga và tình trạng, không có ảnh hay mô tả nội bộ. */
export function publicNotice(incident: Pick<StationIncident, "type" | "stationId">) {
  return {
    title: `${INCIDENT_PUBLIC_NAME[incident.type]} gặp sự cố · Ga ${stationName(incident.stationId)}`,
    content: "Nhân viên ga đang xử lý. Vui lòng đi theo hướng dẫn tại ga.",
  };
}

function patch(
  id: string,
  change: Partial<StationIncident>,
  event: Omit<IncidentEvent, "actorName" | "at">,
) {
  incidentsStore.set((list) =>
    list.map((incident) =>
      incident.id === id
        ? {
            ...incident,
            ...change,
            history: [
              ...incident.history,
              { ...event, actorName: getActorName(), at: new Date().toISOString() },
            ],
          }
        : incident,
    ),
  );
}

const find = (id: string) => incidentsStore.get().find((incident) => incident.id === id);

/** Đổi trạng thái theo một chiều như app: Mới → Đang xử lý → Đã xử lý, được phép bỏ qua bước giữa. */
export function updateIncidentStatus(id: string, status: IncidentStatus): string | null {
  const incident = find(id);
  if (!incident) return "Không tìm thấy sự cố";
  const order: IncidentStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];
  if (order.indexOf(status) <= order.indexOf(incident.status))
    return "Sự cố đã qua bước này, hãy tải lại để xem trạng thái mới.";

  const resolving = status === "RESOLVED";
  // Xử lý xong thì gỡ thông báo; đề xuất còn treo không còn ý nghĩa nên đóng lại.
  if (resolving && incident.announcementId) endNow(incident.announcementId);
  patch(
    id,
    {
      status,
      ...(resolving && {
        announcementId: undefined,
        publication: incident.publication === "PENDING" ? "NONE" : incident.publication,
      }),
    },
    { kind: "STATUS", status },
  );
  logAction(`Sự cố: ${status === "RESOLVED" ? "đã xử lý" : "đang xử lý"}`, id);
  return null;
}

/** Duyệt đề xuất của nhân viên, hoặc tự đăng khi thấy cần báo cho hành khách. */
export function publishIncident(id: string): string | null {
  const incident = find(id);
  if (!incident) return "Không tìm thấy sự cố";
  if (!isOpen(incident)) return "Sự cố đã xử lý xong, không cần báo hành khách.";
  if (incident.publication === "PUBLISHED") return "Sự cố này đã được đăng.";
  const announcement = publish({
    ...emptyDraft(),
    ...publicNotice(incident),
    severity: ANNOUNCEMENT_SEVERITY[incident.severity],
    stationId: incident.stationId,
    audience: "PASSENGER",
    channels: ["IN_APP", "PUSH"],
  });
  patch(id, { publication: "PUBLISHED", announcementId: announcement.id }, { kind: "PUBLISHED" });
  return null;
}

export function declinePublication(id: string, reason: string) {
  patch(id, { publication: "NONE" }, { kind: "PUBLISH_DECLINED", note: reason });
  logAction("Sự cố: không báo hành khách", id);
}
