import {
  announcementsApi,
  type AnnouncementResponse,
  type CreateAnnouncementBody,
} from "@/lib/api";
import { lineCode, stationName } from "@/lib/network";
import { useSyncedQuery } from "@/lib/query-sync";
import { createStore } from "@/lib/store";
import { announcementsStore, type Announcement } from "@/stores/announcements";
import {
  TARGET_ROLES,
  type AnnouncementPhase,
} from "@/pages/notifications/notifications.constants";
import type { AnnouncementDraft, DraftErrors } from "@/pages/notifications/notifications.types";
import { linkToActiveWork } from "@/pages/approvals/work-requests.service";

// UC13-04 "Gửi thông báo vận hành": Admin soạn, gửi Manager duyệt; duyệt xong backend tự gửi.

export const ANNOUNCEMENTS_KEY = ["announcements"] as const;

const pad = (n: number) => String(n).padStart(2, "0");
/** Instant ISO → giá trị ô datetime-local theo giờ máy. */
export const toInput = (iso: string | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** Ô datetime-local (giờ máy) → Instant ISO. */
const toIso = (input: string) => new Date(input).toISOString();

export const toAnnouncement = (a: AnnouncementResponse): Announcement => ({
  id: String(a.id),
  title: a.title,
  content: a.content,
  severity: a.severity,
  scope: a.scope,
  lineId: a.lineId == null ? undefined : String(a.lineId),
  stationId: a.stationId == null ? undefined : String(a.stationId),
  targetRole: a.targetRole ?? undefined,
  startsAt: a.startsAt ?? a.createdAt,
  endsAt: a.endsAt ?? undefined,
  status: a.status,
  createdBy: a.createdBy,
  approvedBy: a.approvedBy,
  approvedAt: a.approvedAt,
  rejectionReason: a.rejectionReason,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

/** Mọi thông báo (người có quyền quản lý thấy cả nháp), đồng bộ vào `announcementsStore`. */
export function useAnnouncementsData(enabled = true) {
  return useSyncedQuery({
    queryKey: ANNOUNCEMENTS_KEY,
    queryFn: () => announcementsApi.list(),
    store: announcementsStore,
    map: (list: AnnouncementResponse[]) => list.map(toAnnouncement),
    enabled,
  });
}

export function phaseOf(
  a: Pick<Announcement, "status" | "startsAt" | "endsAt">,
  now = new Date(),
): AnnouncementPhase {
  if (a.status === "DRAFT") return "DRAFT";
  if (a.status === "PENDING_APPROVAL") return "PENDING";
  if (a.status === "REJECTED") return "REJECTED";
  if (new Date(a.startsAt) > now) return "SCHEDULED";
  if (a.endsAt && new Date(a.endsAt) <= now) return "ENDED";
  return "ACTIVE";
}

const roleLabel = (code?: string) => TARGET_ROLES.find(([c]) => c === code)?.[1] ?? code ?? "—";

export function scopeLabel(a: Pick<Announcement, "scope" | "lineId" | "stationId" | "targetRole">) {
  if (a.scope === "STATION") return `Ga ${stationName(a.stationId)}`;
  if (a.scope === "LINE") return `Toàn ${lineCode(a.lineId)}`;
  if (a.scope === "ROLE") return `Vai trò ${roleLabel(a.targetRole)}`;
  return "Toàn hệ thống";
}

export function emptyDraft(now = new Date()): AnnouncementDraft {
  return {
    title: "",
    content: "",
    severity: "INFO",
    scope: "ALL",
    startsAt: toInput(now.toISOString()),
    endsAt: "",
  };
}

/** Kiểm tra theo UC13-04 và ràng buộc của backend (phạm vi phải đi kèm tuyến/ga/vai trò). */
export function validateDraft(d: AnnouncementDraft): DraftErrors {
  const e: DraftErrors = {};
  if (!d.title.trim()) e.title = "Vui lòng nhập tiêu đề";
  else if (d.title.length > 200) e.title = "Tiêu đề tối đa 200 ký tự";
  if (!d.content.trim()) e.content = "Vui lòng nhập nội dung";
  else if (d.content.length > 2000) e.content = "Nội dung tối đa 2000 ký tự";
  if (d.scope === "LINE" && !d.lineId) e.line = "Chọn tuyến nhận thông báo";
  if (d.scope === "STATION" && !d.stationId) e.station = "Chọn ga nhận thông báo";
  if (d.scope === "ROLE" && !d.targetRole) e.role = "Chọn vai trò nhận thông báo";
  if (!d.startsAt) e.period = "Chọn thời điểm bắt đầu";
  else if (d.endsAt && new Date(d.endsAt) <= new Date(d.startsAt))
    e.period = "Thời điểm kết thúc phải sau thời điểm bắt đầu";
  return e;
}

export function toBody(d: AnnouncementDraft): CreateAnnouncementBody {
  return {
    title: d.title.trim(),
    content: d.content.trim(),
    severity: d.severity,
    scope: d.scope,
    lineId: d.scope === "LINE" || d.scope === "STATION" ? Number(d.lineId) || undefined : undefined,
    stationId: d.scope === "STATION" ? Number(d.stationId) : undefined,
    targetRole: d.scope === "ROLE" ? d.targetRole : undefined,
    startsAt: d.startsAt ? toIso(d.startsAt) : undefined,
    endsAt: d.endsAt ? toIso(d.endsAt) : undefined,
  };
}

export function toDraft(a: Announcement): AnnouncementDraft {
  return {
    title: a.title,
    content: a.content,
    severity: a.severity,
    scope: a.scope,
    lineId: a.lineId,
    stationId: a.stationId,
    targetRole: a.targetRole,
    startsAt: toInput(a.startsAt),
    endsAt: toInput(a.endsAt),
  };
}

/** Lưu nháp (tạo mới hoặc sửa). Sửa bản bị từ chối thì backend đưa về DRAFT. */
export function saveDraft(d: AnnouncementDraft, editingId?: string) {
  return editingId
    ? announcementsApi.update(Number(editingId), toBody(d))
    : announcementsApi.create(toBody(d));
}

/** Lưu rồi gửi Manager duyệt. */
export async function submitDraft(d: AnnouncementDraft, editingId?: string) {
  const saved = await saveDraft(d, editingId);
  return submitAnnouncement(saved.id, saved.title);
}

/** Gửi duyệt một thông báo đã lưu; gắn vào yêu cầu công việc Admin đang làm (nếu có). */
export async function submitAnnouncement(id: number, title: string) {
  const submitted = await announcementsApi.submit(id);
  linkToActiveWork(`ANNOUNCEMENT:${id}`, `Thông báo: ${title}`);
  return submitted;
}

/** Thông báo đã duyệt đang hiệu lực mà hành khách thấy (dùng cho bản đồ và trang ga). */
export const activeForPassengers = (list: Announcement[], now = new Date()) =>
  list.filter(
    (a) => (a.scope !== "ROLE" || a.targetRole === "PASSENGER") && phaseOf(a, now) === "ACTIVE",
  );

/** Bản nháp chờ mở ở trang Thông báo (đặt từ Bản đồ / Ga khi bấm "Tạo thông báo"). */
export const draftPrefillStore = createStore<{
  draft: Partial<AnnouncementDraft>;
  editingId?: string;
} | null>(null);
