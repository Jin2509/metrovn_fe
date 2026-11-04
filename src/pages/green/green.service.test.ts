import { afterEach, describe, expect, it } from "vitest";
import { approvalsStore } from "@/mocks/admin";
import { DEFAULT_GREEN_CONFIG as C, greenConfigStore, type GreenConfig } from "@/mocks/green";
import { loyaltyMembers } from "@/mocks/loyalty";
import { applyApprovalDecision } from "@/pages/approvals/approvals.service";
import {
  diffGreenConfig,
  cpointForCheckins,
  maskEmail,
  pointsPerCheckin,
  previewFare,
  submitGreenConfig,
  tierOf,
  topMembers,
  validateGreenConfig,
} from "@/pages/green/green.service";

const seedApprovals = [...approvalsStore.get()];
afterEach(() => {
  approvalsStore.set(() => seedApprovals);
  greenConfigStore.set(() => C);
});

const tier = (id: string) => C.tiers.find((t) => t.id === id)!;

describe("tích điểm theo lần check-in", () => {
  it("mỗi loại vé có mức điểm riêng: ngày 10, 3 ngày 30, tháng 100", () => {
    expect(pointsPerCheckin("TT2", C)).toBe(10);
    expect(pointsPerCheckin("TT3", C)).toBe(30);
    expect(pointsPerCheckin("TT4", C)).toBe(100);
  });

  it("CPoint nhân theo số lần check-in, không check-in thì không có điểm", () => {
    expect(cpointForCheckins("TT2", 6, C)).toBe(60);
    expect(cpointForCheckins("TT4", 2, C)).toBe(200);
    expect(cpointForCheckins("TT4", 0, C)).toBe(0);
  });

  it("loại vé mới chưa khai báo thì được 0 điểm", () => {
    expect(pointsPerCheckin("TT99", C)).toBe(0);
  });

  it("thành viên demo của mobile: 635 CPoint ở cấp Cây xanh", () => {
    expect(tierOf(635, C.tiers)).toMatchObject({
      tier: { id: "TREE" },
      next: { id: "FOREST" },
      cpointToNext: 1365,
    });
  });

  it("đúng mốc thì lên cấp, cấp cao nhất không còn cấp kế tiếp", () => {
    expect(tierOf(99, C.tiers).tier.id).toBe("SEED");
    expect(tierOf(100, C.tiers).tier.id).toBe("SPROUT");
    expect(tierOf(5000, C.tiers)).toMatchObject({ next: null, cpointToNext: 0 });
  });
});

describe("top thành viên", () => {
  it("lấy tối đa 10 người, nhiều CPoint xếp trước, kèm cấp đúng", () => {
    const top = topMembers(loyaltyMembers, C.tiers);
    expect(top).toHaveLength(10);
    expect(top[0]).toMatchObject({ rank: 1, cpoint: 2600, tier: { id: "FOREST" } });
    const points = top.map((member) => member.cpoint);
    expect(points).toEqual([...points].sort((a, b) => b - a));
  });

  it("che email", () => {
    expect(maskEmail("user12@metro.vn")).toBe("us***@metro.vn");
  });
});

describe("previewFare", () => {
  const base = { ticketTypeId: "TT2", base: 40000, tier: tier("TREE"), isStudent: false };

  it("giảm theo cấp trên loại vé trong phạm vi", () => {
    const fare = previewFare({ ...base, ticketTypeId: "TT4", base: 300000 }, C.policy);
    expect(fare).toMatchObject({ blocked: false, total: 285000 });
  });

  it("sinh viên giảm 20% trước, cấp tính trên phần còn lại", () => {
    const fare = previewFare({ ...base, isStudent: true }, C.policy);
    expect(fare).toMatchObject({ total: 30400, lines: [{ amount: 8000 }, { amount: 1600 }] });
  });

  it("vé tháng HSSV không giảm thêm chính sách sinh viên", () => {
    const fare = previewFare(
      { ...base, ticketTypeId: "TT5", base: 150000, isStudent: true },
      C.policy,
    );
    expect(fare).toMatchObject({ total: 142500, lines: [{ label: "Cấp Cây xanh" }] });
  });

  it("vé tháng HSSV chặn người chưa xác nhận sinh viên", () => {
    expect(previewFare({ ...base, ticketTypeId: "TT5" }, C.policy).blocked).toBe(true);
  });
});

describe("kiểm tra và phê duyệt cấu hình", () => {
  const edit = (patch: Partial<GreenConfig>): GreenConfig => ({ ...C, ...patch });
  const withTiers = (fn: (t: GreenConfig["tiers"][number], i: number) => object) =>
    edit({ tiers: C.tiers.map((t, i) => ({ ...t, ...fn(t, i) })) });

  it("cấu hình mặc định hợp lệ", () => {
    expect(validateGreenConfig(C)).toEqual([]);
  });

  it("điểm check-in phải là số nguyên không âm", () => {
    const bad = edit({ checkinPoints: { TT2: -1 } });
    expect(validateGreenConfig(bad)[0]).toMatch(/số nguyên/);
    expect(validateGreenConfig(edit({ checkinPoints: { TT2: 1.5 } }))[0]).toMatch(/số nguyên/);
  });

  it("bắt lỗi mốc không tăng dần và mức giảm tụt", () => {
    expect(validateGreenConfig(withTiers((_, i) => (i === 2 ? { fromCpoint: 50 } : {})))).toContain(
      "Mốc CPoint phải tăng dần theo cấp.",
    );
    expect(
      validateGreenConfig(withTiers((_, i) => (i === 3 ? { discountPercent: 1 } : {})))[0],
    ).toMatch(/không được có mức giảm thấp hơn/);
  });

  it("chỉ liệt kê các dòng thay đổi", () => {
    const changes = diffGreenConfig(C, edit({ checkinPoints: { ...C.checkinPoints, TT2: 15 } }));
    expect(changes).toEqual([{ field: "Điểm mỗi check-in: Vé ngày", old: "10", new: "15" }]);
  });

  it("chưa có hiệu lực khi chưa duyệt, chặn gửi trùng, duyệt xong mới áp dụng", () => {
    const next = edit({ checkinPoints: { ...C.checkinPoints, TT2: 15 } });
    expect(submitGreenConfig(next)).toBeNull();
    expect(greenConfigStore.get().checkinPoints.TT2).toBe(10);
    expect(submitGreenConfig(edit({ checkinPoints: { ...C.checkinPoints, TT2: 20 } }))).toMatch(
      /chờ Manager duyệt/,
    );
    const approval = approvalsStore.get().find((a) => a.type === "GREEN_POLICY")!;
    applyApprovalDecision(approval, "APPROVED");
    expect(greenConfigStore.get().checkinPoints.TT2).toBe(15);
  });

  it("từ chối thì cấu hình giữ nguyên", () => {
    submitGreenConfig(edit({ checkinPoints: { ...C.checkinPoints, TT2: 15 } }));
    const approval = approvalsStore.get().find((a) => a.type === "GREEN_POLICY")!;
    applyApprovalDecision(approval, "REJECTED", "Chưa hợp lý");
    expect(greenConfigStore.get().checkinPoints.TT2).toBe(10);
  });

  it("không gửi khi chưa có thay đổi", () => {
    expect(submitGreenConfig(C)).toMatch(/chưa có gì thay đổi/);
  });
});
