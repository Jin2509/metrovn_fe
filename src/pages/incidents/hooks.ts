import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  announcementsApi,
  apiErrorMessage,
  incidentsApi,
  type AnnouncementApiSeverity,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { IncidentSeverity, StationIncident } from "@/stores/incidents";
import { INCIDENT_TYPE_LABEL } from "@/pages/incidents/incidents.constants";
import { INCIDENTS_KEY, useIncidentsData } from "@/pages/incidents/incidents.service";
import { submitAnnouncement } from "@/pages/notifications/notifications.service";

export const INCIDENT_MANAGE = "INCIDENT_MANAGE";
const ANNOUNCEMENT_MANAGE = "ANNOUNCEMENT_MANAGE";

const ANNOUNCEMENT_SEVERITY: Record<IncidentSeverity, AnnouncementApiSeverity> = {
  CRITICAL: "CRITICAL",
  HIGH: "WARNING",
  MEDIUM: "WARNING",
  LOW: "INFO",
};

/** Nội dung hành khách thấy: chỉ tên ga và tình trạng, không có ảnh hay mô tả nội bộ. */
export function publicNotice(incident: Pick<StationIncident, "type" | "stationName">) {
  return {
    title: `${INCIDENT_TYPE_LABEL[incident.type]} gặp sự cố · Ga ${incident.stationName}`,
    content: "Nhân viên ga đang xử lý. Vui lòng đi theo hướng dẫn tại ga.",
  };
}

export function useIncidents() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(INCIDENT_MANAGE);
  const canAnnounce = hasPermission(ANNOUNCEMENT_MANAGE);
  const data = useIncidentsData(canManage);
  const [pending, setPending] = useState(false);

  const run = async (task: () => Promise<unknown>, success: string) => {
    if (pending) return false;
    setPending(true);
    try {
      await task();
      toast.success(success);
      await queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY });
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error));
      return false;
    } finally {
      setPending(false);
    }
  };

  return {
    ...data,
    canManage,
    canAnnounce,
    pending,
    accept: (i: StationIncident) => run(() => incidentsApi.accept(Number(i.id)), "Đã nhận xử lý"),
    resolve: (i: StationIncident, resolution: string) =>
      run(() => incidentsApi.resolve(Number(i.id), resolution), "Đã ghi nhận xử lý xong"),
    /** Tạo thông báo vận hành tại ga rồi gửi duyệt; duyệt xong backend tự gửi cho hành khách. */
    announce: (i: StationIncident) =>
      run(async () => {
        const created = await announcementsApi.create({
          ...publicNotice(i),
          stationId: Number(i.stationId),
          scope: "STATION",
          severity: ANNOUNCEMENT_SEVERITY[i.severity],
        });
        await submitAnnouncement(created.id, created.title);
        await queryClient.invalidateQueries({ queryKey: ["announcements"] });
      }, "Đã gửi thông báo cho hành khách chờ duyệt"),
  };
}

/** Ảnh hiện trường: tải bằng token rồi hiện qua object URL, thu hồi khi đóng. */
export function useIncidentImage(incident: StationIncident | null) {
  const id = incident?.hasImage ? Number(incident.id) : null;
  const query = useQuery({
    queryKey: [...INCIDENTS_KEY, "image", id],
    queryFn: () => incidentsApi.image(id!),
    enabled: id !== null,
    retry: false,
    staleTime: Infinity,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!query.data) return setUrl(null);
    const next = URL.createObjectURL(query.data);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [query.data]);
  return { url, loading: query.isFetching, error: query.error ? apiErrorMessage(query.error) : "" };
}
