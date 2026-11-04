import { afterEach, describe, expect, it } from "vitest";
import { approvalsStore } from "@/mocks/admin";
import { DEFAULT_GREEN_CONFIG as C, greenConfigStore, type GreenConfig } from "@/mocks/green";
import { applyApprovalDecision } from "@/pages/approvals/approvals.service";
import {
  carKgPerKm,
  cpointOf,
  diffGreenConfig,
  metroKgPerKm,
  motorbikeKgPerKm,
  previewFare,
  savedKg,
  submitGreenConfig,
  tierOf,
  validateGreenConfig,
} from "@/pages/green/green.service";

const seedApprovals = [...approvalsStore.get()];
afterEach(() => {
  approvalsStore.set(() => seedApprovals);
  greenConfigStore.set(() => C);
});

const tier = (id: string) => C.tiers.find((t) => t.id === id)!;

describe("công thức giống app mobile", () => {
  it("hệ số mỗi km khớp số app đang hiển thị", () => {
    expect(carKgPerKm(C.factors)).toBeCloseTo(0.101, 3);
    expect(motorbikeKgPerKm(C.factors)).toBeCloseTo(0.062, 3);
    expect(metroKgPerKm(C.factors)).toBeCloseTo(0.034, 3);
  });

  it("10 km bớt khoảng 0,28 kg CO₂, được 28 CPoint", () => {
    expect(savedKg(10, C.factors)).toBeCloseTo(0.283, 3);
    expect(cpointOf(savedKg(10, C.factors), C)).toBe(28);
  });

  it("thành viên demo của mobile: 635 CPoint (6,35 kg) ở cấp Cây xanh", () => {
    expect(cpointOf(6.35, C)).toBe(635);
    expect(tierOf(6.35, C.tiers)).toMatchObject({ tier: { id: "TREE" }, next: { id: "FOREST" } });
  });

  it("mốc CPoint vào cấp khớp thang của mobile: 0, 100, 500, 2000", () => {
    expect(C.tiers.map((t) => cpointOf(t.fromKg, C))).toEqual([0, 100, 500, 2000]);
  });

  it("đúng mốc thì lên cấp, cấp cao nhất không còn cấp kế tiếp", () => {
    expect(tierOf(0.99, C.tiers).tier.id).toBe("SEED");
    expect(tierOf(1, C.tiers).tier.id).toBe("SPROUT");
    expect(tierOf(50, C.tiers)).toMatchObject({ next: null, kgToNext: 0, progress: 1 });
  });
});

describe("previewFare", () => {
  const base = { ticketTypeId: "TT1", base: 12000, tier: tier("TREE"), isStudent: false };

  it("giảm theo cấp trên mọi loại vé", () => {
    const fare = previewFare({ ...base, ticketTypeId: "TT4", base: 300000 }, C.policy);
    expect(fare).toMatchObject({ blocked: false, total: 285000 });
  });

  it("sinh viên giảm 20% trước, cấp tính trên phần còn lại (như mobile)", () => {
    const fare = previewFare({ ...base, isStudent: true }, C.policy);
    expect(fare).toMatchObject({
      total: 9120,
      lines: [{ amount: 2400 }, { amount: 480 }],
    });
  });

  it("ưu đãi sinh viên chỉ áp dụng trên vé lượt", () => {
    const fare = previewFare(
      { ...base, ticketTypeId: "TT2", base: 40000, isStudent: true },
      C.policy,
    );
    expect(fare).toMatchObject({ total: 38000, lines: [{ label: "Cấp Cây xanh" }] });
  });

  it("vé tháng HSSV chặn người chưa xác nhận sinh viên", () => {
    expect(previewFare({ ...base, ticketTypeId: "TT5" }, C.policy).blocked).toBe(true);
  });

  it("chế độ chỉ lấy mức cao nhất", () => {
    const policy = { ...C.policy, combineMode: "BEST_ONLY" as const };
    const fare = previewFare({ ...base, isStudent: true }, policy);
    expect(fare).toMatchObject({ total: 9600, lines: [{ label: "Ưu đãi sinh viên" }] });
  });

  it("không vượt tổng mức giảm tối đa", () => {
    const policy = { ...C.policy, maxTotalPercent: 21 };
    const fare = previewFare({ ...base, isStudent: true }, policy);
    expect(fare).toMatchObject({ total: 9480, capped: true });
  });
});

describe("kiểm tra và phê duyệt cấu hình", () => {
  const edit = (patch: Partial<GreenConfig>): GreenConfig => ({ ...C, ...patch });
  const withTiers = (fn: (t: GreenConfig["tiers"][number], i: number) => object) =>
    edit({ tiers: C.tiers.map((t, i) => ({ ...t, ...fn(t, i) })) });

  it("cấu hình mặc định hợp lệ", () => {
    expect(validateGreenConfig(C)).toEqual([]);
  });

  it("bắt lỗi mốc không tăng dần, mức giảm tụt và xe máy không phát thải hơn Metro", () => {
    expect(validateGreenConfig(withTiers((_, i) => (i === 2 ? { fromKg: 1 } : {})))).toContain(
      "Mốc CO₂ phải tăng dần theo cấp.",
    );
    expect(
      validateGreenConfig(withTiers((_, i) => (i === 3 ? { discountPercent: 1 } : {})))[0],
    ).toMatch(/không được có mức giảm thấp hơn/);
    expect(
      validateGreenConfig(edit({ factors: { ...C.factors, motorbikeLitrePer100Km: 1 } }))[0],
    ).toMatch(/cao hơn Metro/);
  });

  it("chỉ liệt kê các dòng thay đổi", () => {
    const changes = diffGreenConfig(C, edit({ cpointPerKg: 120 }));
    expect(changes).toEqual([{ field: "CPoint mỗi kg CO₂", old: "100", new: "120" }]);
  });

  it("chưa có hiệu lực khi chưa duyệt, chặn gửi trùng, duyệt xong mới áp dụng", () => {
    const next = edit({ cpointPerKg: 120 });
    expect(submitGreenConfig(next)).toBeNull();
    expect(greenConfigStore.get().cpointPerKg).toBe(100);
    expect(submitGreenConfig(edit({ cpointPerKg: 150 }))).toMatch(/chờ Manager duyệt/);

    const approval = approvalsStore.get().find((a) => a.type === "GREEN_POLICY")!;
    applyApprovalDecision(approval, "APPROVED");
    expect(greenConfigStore.get().cpointPerKg).toBe(120);
  });

  it("từ chối thì cấu hình giữ nguyên", () => {
    submitGreenConfig(edit({ cpointPerKg: 120 }));
    const approval = approvalsStore.get().find((a) => a.type === "GREEN_POLICY")!;
    applyApprovalDecision(approval, "REJECTED", "Chưa hợp lý");
    expect(greenConfigStore.get().cpointPerKg).toBe(100);
  });

  it("không gửi khi chưa có thay đổi", () => {
    expect(submitGreenConfig(C)).toMatch(/chưa có gì thay đổi/);
  });
});
