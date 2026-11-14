import type { IncidentSeverity, IncidentStatus, IncidentType } from "@/stores/incidents";

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  EQUIPMENT: "Thiết bị",
  SECURITY: "An ninh",
  MEDICAL: "Y tế",
  PASSENGER: "Hành khách",
  OTHER: "Khác",
};

export const INCIDENT_SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  CRITICAL: "Khẩn cấp",
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
};
