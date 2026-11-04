import { assignmentCatalog } from "@/lib/catalogs";
import { requestUpdate } from "@/lib/change-requests";

/** Phân công và gỡ phân công đều chờ Manager duyệt. */
export function assignStaffToStation(userId: string, stationId: string): string | null {
  if (!userId || !stationId) return "Vui lòng chọn nhân viên và ga";
  return requestUpdate(assignmentCatalog, userId, { stationId });
}

export function unassignStaffFromStation(userId: string): string | null {
  return requestUpdate(assignmentCatalog, userId, { stationId: null });
}
