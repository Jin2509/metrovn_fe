import { afterEach, describe, expect, it } from "vitest";

import { usersStore } from "@/mocks/admin";
import { announcementsStore } from "@/mocks/announcements";
import {
  activeForPassengers,
  emptyDraft,
  endNow,
  phaseOf,
  publish,
  recipientCount,
  resendFailed,
  validateDraft,
} from "@/pages/notifications/notifications.service";
import type { AnnouncementDraft } from "@/pages/notifications/notifications.types";

const seed = announcementsStore.get();
afterEach(() => announcementsStore.set(() => seed));
const draft = (patch: Partial<AnnouncementDraft> = {}): AnnouncementDraft => ({
  ...emptyDraft(new Date(2026, 9, 27, 8, 0)),
  title: "Bảo trì",
  content: "Nội dung",
  ...patch,
});

describe("UC13-04 kiểm tra dữ liệu", () => {
  it("báo thiếu tiêu đề, nội dung và không có người nhận", () => {
    expect(validateDraft(draft({ title: "", content: " " }), 0)).toEqual({
      title: "Vui lòng nhập tiêu đề",
      content: "Vui lòng nhập nội dung",
      recipients: "Không có người nhận",
    });
  });

  it("kế toán chỉ nhận email: chọn kênh khác coi như chưa chọn kênh", () => {
    expect(validateDraft(draft({ audience: "ACCOUNTANT", channels: ["PUSH"] }), 5).channels).toBe(
      "Chọn ít nhất một kênh gửi",
    );
    expect(validateDraft(draft({ audience: "ACCOUNTANT", channels: ["EMAIL"] }), 5)).toEqual({});
  });

  it("thời điểm kết thúc phải sau bắt đầu", () => {
    expect(validateDraft(draft({ endsAt: "2026-10-27T07:00" }), 5).period).toBeDefined();
  });
});

describe("người nhận và gửi", () => {
  it("đếm tài khoản đang hoạt động theo nhóm; Tất cả = hành khách + nhân viên + kế toán", () => {
    const users = usersStore.get();
    const n = (r: string) => users.filter((u) => u.status === "ACTIVE" && u.role === r).length;
    expect(recipientCount("PASSENGER")).toBe(n("PASSENGER"));
    expect(recipientCount("ALL")).toBe(n("PASSENGER") + n("STAFF") + n("ACCOUNTANT"));
  });

  it("gửi lưu kết quả theo số người nhận; gửi lại xóa lỗi", () => {
    const rec = publish(draft({ audience: "STAFF", channels: ["EMAIL"] }), undefined, [
      {
        id: "1",
        name: "a",
        email: "a@metro.vn",
        role: "STAFF",
        status: "ACTIVE",
        stationId: null,
        createdAt: "",
      },
      {
        id: "2",
        name: "b",
        email: "sai-email",
        role: "STAFF",
        status: "ACTIVE",
        stationId: null,
        createdAt: "",
      },
      {
        id: "3",
        name: "c",
        email: "c@metro.vn",
        role: "STAFF",
        status: "LOCKED",
        stationId: null,
        createdAt: "",
      },
    ]);
    expect(rec.delivery).toEqual({ recipients: 2, sent: 1, failed: 1, read: 0 });
    resendFailed(rec.id);
    expect(announcementsStore.get().find((a) => a.id === rec.id)?.delivery?.failed).toBe(0);
  });
});

describe("thời gian hiệu lực", () => {
  const now = new Date(2026, 9, 27, 12, 0);
  it("phân loại nháp / sắp hiệu lực / đang hiệu lực / đã kết thúc", () => {
    const a = { status: "PUBLISHED" as const, startsAt: "2026-10-27 08:00" };
    expect(phaseOf({ ...a, status: "DRAFT" }, now)).toBe("DRAFT");
    expect(phaseOf({ ...a, startsAt: "2026-10-28 08:00" }, now)).toBe("SCHEDULED");
    expect(phaseOf({ ...a, endsAt: "2026-10-27 18:00" }, now)).toBe("ACTIVE");
    expect(phaseOf({ ...a, endsAt: "2026-10-27 10:00" }, now)).toBe("ENDED");
  });

  it("kết thúc sớm làm thông báo không còn hiện cho hành khách", () => {
    const active = activeForPassengers(announcementsStore.get());
    expect(active.length).toBeGreaterThan(0);
    endNow(active[0].id);
    expect(activeForPassengers(announcementsStore.get()).some((a) => a.id === active[0].id)).toBe(
      false,
    );
  });
});
