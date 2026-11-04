import { afterEach, describe, expect, it } from "vitest";
import { approvalsStore } from "@/mocks/admin";
import { DEFAULT_SYSTEM_PARAMS, getParam, systemParamsStore } from "@/mocks/system-params";
import { applyApprovalDecision } from "@/pages/approvals/approvals.service";
import { currentStudentRules } from "@/pages/studentverification/student.service";
import {
  diffParams,
  submitParams,
  toValues,
  validateParams,
} from "@/pages/systemparams/systemparams.service";

const seedApprovals = [...approvalsStore.get()];
afterEach(() => {
  approvalsStore.set(() => seedApprovals);
  systemParamsStore.set(() => DEFAULT_SYSTEM_PARAMS);
});

const base = toValues(DEFAULT_SYSTEM_PARAMS);
const pending = () => approvalsStore.get().find((a) => a.type === "SYSTEM_PARAM")!;

describe("kiểm tra tham số", () => {
  it("mặc định hợp lệ", () => {
    expect(validateParams(DEFAULT_SYSTEM_PARAMS, base)).toEqual([]);
  });

  it("chặn ngoài khoảng, ô trống và ngưỡng sinh viên ngược nhau", () => {
    const check = (patch: Record<string, number>) =>
      validateParams(DEFAULT_SYSTEM_PARAMS, { ...base, ...patch })[0];
    expect(check({ "payment.qrExpiryMinutes": 0 })).toMatch(/từ 1 đến 60/);
    expect(check({ "payment.qrExpiryMinutes": Number.NaN })).toMatch(/nhập số/);
    expect(check({ "student.autoApprovePercent": 40 })).toMatch(/cao hơn/);
  });

  it("chỉ liệt kê tham số đã đổi", () => {
    const changes = diffParams(DEFAULT_SYSTEM_PARAMS, { ...base, "payment.qrExpiryMinutes": 15 });
    expect(changes).toEqual([
      { field: "Hiệu lực mã QR thanh toán", old: "10 phút", new: "15 phút" },
    ]);
  });
});

describe("luồng duyệt", () => {
  const next = { ...base, "student.autoApprovePercent": 80 };

  it("chưa duyệt thì chưa đổi, duyệt xong mới có tác dụng lên nghiệp vụ", () => {
    expect(submitParams(next)).toBeNull();
    expect(getParam("student.autoApprovePercent")).toBe(90);
    applyApprovalDecision(pending(), "APPROVED");
    expect(getParam("student.autoApprovePercent")).toBe(80);
    expect(currentStudentRules().autoApproveConfidence).toBeCloseTo(0.8);
    expect(
      systemParamsStore.get().find((p) => p.key === "student.autoApprovePercent")?.updatedBy,
    ).toBeTruthy();
  });

  it("từ chối thì giữ nguyên", () => {
    submitParams(next);
    applyApprovalDecision(pending(), "REJECTED", "Chưa hợp lý");
    expect(getParam("student.autoApprovePercent")).toBe(90);
  });

  it("chặn gửi trùng và gửi khi chưa đổi gì", () => {
    expect(submitParams(base)).toMatch(/Chưa có tham số/);
    submitParams(next);
    expect(submitParams({ ...base, "payment.qrExpiryMinutes": 15 })).toMatch(/chờ Manager/);
  });
});
