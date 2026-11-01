import { describe, expect, it } from "vitest";
import type { AuditLog } from "@/lib/api";
import { auditActionLabel, auditActorName, auditDayRange } from "./auditlogs.service";

const user = { id: "u", email: "nv@metro.vn", fullName: "Nhân Viên" };
const admin = { id: "a", email: "ad@metro.vn", fullName: "Quản Trị" };
const log = (type: string, actor: AuditLog["actor"] = null): AuditLog => ({
  id: "1",
  type,
  user,
  actor,
  ipAddress: null,
  userAgent: null,
  createdAt: "2026-11-01T12:38:43.309722Z",
});

describe("auditActionLabel", () => {
  it("đổi mã thành câu hiển thị, mã lạ thì giữ nguyên", () => {
    expect(auditActionLabel("ACCOUNT_LOCKED")).toBe("Khoá tài khoản");
    expect(auditActionLabel("NEW_EVENT")).toBe("NEW_EVENT");
  });
});

describe("auditActorName", () => {
  it("admin thực hiện: hiện admin", () => {
    expect(auditActorName(log("ACCOUNT_LOCKED", admin))).toBe("Quản Trị");
  });

  it("chính chủ thực hiện: hiện chủ tài khoản", () => {
    expect(auditActorName(log("LOGIN_SUCCESS"))).toBe("Nhân Viên");
  });

  it.each(["LOGIN_FAILED", "TOKEN_REUSE_DETECTED", "ACCOUNT_LOCKED", "NEW_EVENT"])(
    "%s không có actor: không gán cho chủ tài khoản",
    (type) => {
      expect(auditActorName(log(type))).toBe("Không xác định");
    },
  );
});

describe("auditDayRange", () => {
  it("không chọn ngày: không lọc", () => {
    expect(auditDayRange("")).toEqual({});
  });

  it("trọn một ngày theo giờ máy, `to` là đầu ngày hôm sau", () => {
    const { from, to } = auditDayRange("2026-11-01");
    expect(new Date(from!).getTime()).toBe(new Date(2026, 10, 1).getTime());
    expect(new Date(to!).getTime()).toBe(new Date(2026, 10, 2).getTime());
  });
});
