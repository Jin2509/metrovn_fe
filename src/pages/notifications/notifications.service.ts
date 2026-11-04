import { adminUsersApi, notificationsApi } from "@/lib/api";
import { getActorName } from "@/lib/auth/session.store";
import { createStore } from "@/lib/store";
import { lineCode, stationName } from "@/lib/network";
import { logAction, usersStore, type User } from "@/mocks/admin";
import {
  announcementsStore,
  fmtDateTime,
  type Announcement,
  type AnnouncementAudience,
} from "@/mocks/announcements";
import {
  CHANNELS_BY_AUDIENCE,
  type AnnouncementPhase,
} from "@/pages/notifications/notifications.constants";
import type { AnnouncementDraft, DraftErrors } from "@/pages/notifications/notifications.types";

// UC13-04 "Gửi thông báo vận hành": Admin soạn tiêu đề, nội dung, chọn nhóm nhận; hệ thống kiểm tra,
// xác định danh sách người nhận, gửi và lưu lịch sử (nội dung, nhóm nhận, thời điểm, người gửi).

const toInput = (s: string) => s.replace(" ", "T");
const fromInput = (s: string) => s.replace("T", " ");
const parse = (s: string) => new Date(s.replace(" ", "T"));

// Manager theo dõi vận hành nên luôn nhận bản sao, dù nhóm nhận là ai.
const ROLES_BY_AUDIENCE: Record<AnnouncementAudience, User["role"][]> = {
  PASSENGER: ["PASSENGER", "MANAGER"],
  STAFF: ["STAFF", "MANAGER"],
  ACCOUNTANT: ["ACCOUNTANT", "MANAGER"],
  ALL: ["PASSENGER", "STAFF", "ACCOUNTANT", "MANAGER"],
};

/** Số tài khoản đang hoạt động trong nhóm nhận (bảng users, status = ACTIVE). */
export function recipientCount(audience: AnnouncementAudience, users: User[] = usersStore.get()) {
  return users.filter((u) => u.status === "ACTIVE" && ROLES_BY_AUDIENCE[audience].includes(u.role))
    .length;
}

export function phaseOf(
  a: Pick<Announcement, "status" | "startsAt" | "endsAt">,
  now = new Date(),
): AnnouncementPhase {
  if (a.status === "DRAFT") return "DRAFT";
  if (parse(a.startsAt) > now) return "SCHEDULED";
  if (a.endsAt && parse(a.endsAt) <= now) return "ENDED";
  return "ACTIVE";
}

export function scopeLabel(a: Pick<Announcement, "lineId" | "stationId">) {
  if (a.stationId) return `Ga ${stationName(a.stationId)}`;
  if (a.lineId) return `Toàn ${lineCode(a.lineId)}`;
  return "Toàn hệ thống";
}

export function emptyDraft(now = new Date()): AnnouncementDraft {
  return {
    title: "",
    content: "",
    severity: "INFO",
    audience: "PASSENGER",
    channels: ["IN_APP", "PUSH"],
    startsAt: toInput(fmtDateTime(now)),
    endsAt: "",
  };
}

/** Kiểm tra theo UC13-04 (luồng A1, A2) và ràng buộc của bảng announcement. */
export function validateDraft(d: AnnouncementDraft, recipients: number): DraftErrors {
  const e: DraftErrors = {};
  if (!d.title.trim()) e.title = "Vui lòng nhập tiêu đề";
  else if (d.title.length > 200) e.title = "Tiêu đề tối đa 200 ký tự";
  if (!d.content.trim()) e.content = "Vui lòng nhập nội dung";
  else if (d.content.length > 2000) e.content = "Nội dung tối đa 2000 ký tự";
  const allowed = CHANNELS_BY_AUDIENCE[d.audience];
  if (!d.channels.filter((c) => allowed.includes(c)).length)
    e.channels = "Chọn ít nhất một kênh gửi";
  if (!d.startsAt) e.period = "Chọn thời điểm bắt đầu";
  else if (d.endsAt && parse(d.endsAt) <= parse(d.startsAt))
    e.period = "Thời điểm kết thúc phải sau thời điểm bắt đầu";
  if (recipients === 0) e.recipients = "Không có người nhận";
  return e;
}

function toRecord(d: AnnouncementDraft, base?: Announcement): Announcement {
  const allowed = CHANNELS_BY_AUDIENCE[d.audience];
  return {
    id: base?.id ?? `TB-${String(Date.now()).slice(-4)}`,
    title: d.title.trim(),
    content: d.content.trim(),
    severity: d.severity,
    audience: d.audience,
    channels: d.channels.filter((c) => allowed.includes(c)),
    lineId: d.lineId,
    stationId: d.stationId,
    startsAt: fromInput(d.startsAt),
    endsAt: d.endsAt ? fromInput(d.endsAt) : undefined,
    status: "DRAFT",
    createdBy: base?.createdBy ?? getActorName(),
    createdAt: base?.createdAt ?? fmtDateTime(new Date()),
  };
}

export function toDraft(a: Announcement): AnnouncementDraft {
  return {
    title: a.title,
    content: a.content,
    severity: a.severity,
    audience: a.audience,
    channels: a.channels,
    lineId: a.lineId,
    stationId: a.stationId,
    startsAt: toInput(a.startsAt),
    endsAt: a.endsAt ? toInput(a.endsAt) : "",
  };
}

export function saveDraft(d: AnnouncementDraft, editingId?: string) {
  const base = announcementsStore.get().find((a) => a.id === editingId);
  const record = toRecord(d, base);
  announcementsStore.set((list) =>
    base ? list.map((a) => (a.id === base.id ? record : a)) : [record, ...list],
  );
  logAction("Lưu nháp thông báo vận hành", record.title);
  return record;
}

const MAX_USER_IDS_PER_REQUEST = 1000;

/** Backend chưa có hẹn giờ gửi: mọi thông báo được gửi ngay. */
export function isScheduledForLater(d: Pick<AnnouncementDraft, "startsAt">, now = new Date()) {
  return !!d.startsAt && parse(d.startsAt) > now;
}

async function activeUserIdsOf(roles: string[]) {
  const ids: string[] = [];
  for (let page = 0, totalPages = 1; page < totalPages; page++) {
    const result = await adminUsersApi.list({ status: "ACTIVE", page, size: 100 });
    totalPages = result.page.totalPages;
    ids.push(
      ...result.content.filter((u) => u.roles.some((r) => roles.includes(r))).map((u) => u.id),
    );
  }
  return ids;
}

/**
 * Gửi thật qua backend và trả về số người nhận. Backend chỉ lưu thông báo trong ứng dụng,
 * chưa có kênh email/push, mức độ, phạm vi tuyến/ga hay thời điểm kết thúc.
 */
export async function deliverToBackend(d: AnnouncementDraft) {
  const content = { title: d.title.trim(), body: d.content.trim() };
  if (d.audience === "ALL")
    return (await notificationsApi.send({ ...content, all: true })).recipients;

  const ids = await activeUserIdsOf(ROLES_BY_AUDIENCE[d.audience]);
  let recipients = 0;
  for (let i = 0; i < ids.length; i += MAX_USER_IDS_PER_REQUEST) {
    const userIds = ids.slice(i, i + MAX_USER_IDS_PER_REQUEST);
    recipients += (await notificationsApi.send({ ...content, userIds })).recipients;
  }
  return recipients;
}

/**
 * Gửi: tạo một dòng notification cho mỗi người nhận và đẩy vào hàng đợi gửi (chạy nền).
 * Bản demo coi như gửi xong ngay; email sai định dạng được tính là gửi lỗi (luồng A4).
 */
export function publish(
  d: AnnouncementDraft,
  editingId?: string,
  users: User[] = usersStore.get(),
  /** Số người nhận thật từ backend; có giá trị này thì không ước tính từ dữ liệu giả lập. */
  delivered?: number,
) {
  const base = announcementsStore.get().find((a) => a.id === editingId);
  const targets = users.filter(
    (u) => u.status === "ACTIVE" && ROLES_BY_AUDIENCE[d.audience].includes(u.role),
  );
  const failed = d.channels.includes("EMAIL")
    ? targets.filter((u) => !/^\S+@\S+\.\S+$/.test(u.email)).length
    : 0;
  const record: Announcement = {
    ...toRecord(d, base),
    status: "PUBLISHED",
    sentAt: fmtDateTime(new Date()),
    delivery:
      delivered === undefined
        ? { recipients: targets.length, sent: targets.length - failed, failed, read: 0 }
        : { recipients: delivered, sent: delivered, failed: 0, read: 0 },
  };
  announcementsStore.set((list) =>
    base ? list.map((a) => (a.id === base.id ? record : a)) : [record, ...list],
  );
  logAction("Gửi thông báo vận hành", `${record.title} → ${targets.length} người nhận`);
  return record;
}

export function resendFailed(id: string) {
  announcementsStore.set((list) =>
    list.map((a) =>
      a.id === id && a.delivery
        ? { ...a, delivery: { ...a.delivery, sent: a.delivery.recipients, failed: 0 } }
        : a,
    ),
  );
  logAction("Gửi lại thông báo lỗi", id);
}

/** Kết thúc sớm: đặt ends_at = bây giờ để ứng dụng thôi hiển thị. */
export function endNow(id: string) {
  announcementsStore.set((list) =>
    list.map((a) => (a.id === id ? { ...a, endsAt: fmtDateTime(new Date()) } : a)),
  );
  logAction("Kết thúc thông báo vận hành", id);
}

/** Thông báo đang hiệu lực mà hành khách thấy (dùng cho bản đồ và trang ga). */
export const activeForPassengers = (list: Announcement[], now = new Date()) =>
  list.filter(
    (a) => (a.audience === "PASSENGER" || a.audience === "ALL") && phaseOf(a, now) === "ACTIVE",
  );

/** Bản nháp chờ mở ở trang Thông báo (đặt từ Bản đồ / Ga khi bấm "Tạo thông báo"). */
export const draftPrefillStore = createStore<{
  draft: Partial<AnnouncementDraft>;
  editingId?: string;
} | null>(null);
