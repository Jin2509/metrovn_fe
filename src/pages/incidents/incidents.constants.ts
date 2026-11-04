import type {
  IncidentLocation,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from "@/mocks/incidents";

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  GATE: "Cổng soát vé",
  LIFT: "Thang cuốn, thang máy",
  EQUIPMENT: "Thiết bị khác",
  HYGIENE: "Vệ sinh",
  SECURITY: "An ninh",
  MEDICAL: "Y tế",
  PARKING: "Bãi xe",
  OTHER: "Khác",
};

/** Tên dùng trong thông báo công khai, khác nhãn ở chỗ "Thiết bị" và "Sự cố" đọc tự nhiên hơn. */
export const INCIDENT_PUBLIC_NAME: Record<IncidentType, string> = {
  ...INCIDENT_TYPE_LABEL,
  EQUIPMENT: "Thiết bị",
  OTHER: "Sự cố",
};

export const INCIDENT_LOCATION_LABEL: Record<IncidentLocation, string> = {
  ENTRY_GATE: "Cổng vào",
  EXIT_GATE: "Cổng ra",
  CONCOURSE: "Sảnh",
  PLATFORM: "Sân ga",
  PARKING: "Bãi xe",
  OTHER: "Nơi khác",
};

export const INCIDENT_SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  MINOR: "Nhẹ",
  OPERATIONS: "Ảnh hưởng vận hành",
  EMERGENCY: "Khẩn cấp",
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  OPEN: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
};
