import { describe, expect, it } from "vitest";
import {
  DEFAULT_STUDENT_RULES as R,
  SEED_SUBMISSIONS,
  type StudentSubmission,
} from "@/mocks/student-verifications";
import {
  evaluateSubmission,
  expiryOf,
  isOverdue,
  processSubmissions,
  studentStats,
  toPassengerStatus,
  validateStudentRules,
} from "@/pages/studentverification/student.service";

const now = new Date("2026-11-04T08:00:00Z");
const good: StudentSubmission = {
  id: "T",
  accountName: "Nguyễn Minh Anh",
  accountEmail: "a@x.vn",
  submittedAt: "2026-11-04T07:00:00Z",
  confidence: 0.97,
  card: {
    fullName: "NGUYỄN MINH ANH",
    school: R.schools[0],
    studentCode: "22520001",
    cardExpiry: "2028-06-30",
  },
};
const judge = (patch: Partial<StudentSubmission>, used = false) =>
  evaluateSubmission({ ...good, ...patch }, R, used, now);

describe("evaluateSubmission", () => {
  it("đủ điều kiện thì tự duyệt, không phân biệt hoa thường và dấu của tên", () => {
    expect(judge({})).toEqual({ status: "VERIFIED", reasons: [] });
  });

  it("ảnh mờ hoặc thiếu thông tin thì tự từ chối để chụp lại", () => {
    expect(judge({ confidence: 0.3 }).status).toBe("REJECTED");
    expect(judge({ card: { ...good.card, cardExpiry: null } }).status).toBe("REJECTED");
  });

  it("thẻ hết hạn thì tự từ chối", () => {
    const result = judge({ card: { ...good.card, cardExpiry: "2026-11-03" } });
    expect(result).toEqual({ status: "REJECTED", reasons: ["Thẻ sinh viên đã hết hạn."] });
  });

  it("điểm nghi ngờ thì chuyển người xem: AI chưa chắc, trường lạ, sai tên, trùng mã", () => {
    expect(judge({ confidence: 0.7 }).status).toBe("NEEDS_REVIEW");
    expect(judge({ card: { ...good.card, school: "Trường lạ" } }).status).toBe("NEEDS_REVIEW");
    expect(judge({ card: { ...good.card, fullName: "Trần Văn B" } }).status).toBe("NEEDS_REVIEW");
    expect(judge({}, true).status).toBe("NEEDS_REVIEW");
  });

  it("liệt kê đủ mọi lý do để người xem không phải đoán", () => {
    const result = judge({ confidence: 0.7, card: { ...good.card, school: "Trường lạ" } }, true);
    expect(result.reasons).toHaveLength(3);
  });
});

describe("processSubmissions", () => {
  it("thẻ gửi sau trùng mã mới bị xem xét, không phải thẻ gửi trước", () => {
    const items = processSubmissions(
      [
        {
          ...good,
          id: "SAU",
          accountEmail: "b@x.vn",
          accountName: good.accountName,
          submittedAt: "2026-11-04T07:30:00Z",
        },
        { ...good, id: "TRUOC" },
      ],
      R,
      now,
    );
    expect(items.find((i) => i.id === "TRUOC")?.status).toBe("VERIFIED");
    expect(items.find((i) => i.id === "SAU")?.status).toBe("NEEDS_REVIEW");
  });

  it("thẻ bị từ chối không giữ chỗ mã sinh viên", () => {
    const items = processSubmissions(
      [
        {
          ...good,
          id: "MO",
          accountEmail: "b@x.vn",
          confidence: 0.2,
          submittedAt: "2026-11-04T06:00:00Z",
        },
        { ...good, id: "RO" },
      ],
      R,
      now,
    );
    expect(items.find((i) => i.id === "RO")?.status).toBe("VERIFIED");
  });

  it("dữ liệu mẫu có đủ ba hướng xử lý và tỉ lệ tự động đếm đúng", () => {
    const items = processSubmissions(SEED_SUBMISSIONS, R, new Date());
    const stats = studentStats(items);
    expect(stats.needsReview).toBe(4);
    expect(stats.auto).toBe(4);
    expect(items.some((i) => i.status === "REJECTED")).toBe(true);
  });
});

describe("thời hạn và trạng thái", () => {
  it("hiệu lực 1 năm, nhưng không vượt hạn thẻ", () => {
    expect(expiryOf(good.card, R, now)).toBe("2027-11-04");
    expect(expiryOf({ ...good.card, cardExpiry: "2027-01-15" }, R, now)).toBe("2027-01-15");
  });

  it("đang xem xét hiện với hành khách là chờ duyệt", () => {
    expect(toPassengerStatus("NEEDS_REVIEW")).toBe("PENDING");
    expect(toPassengerStatus("VERIFIED")).toBe("VERIFIED");
  });

  it("quá 24 giờ chưa xử lý thì báo quá hạn", () => {
    const item = { status: "NEEDS_REVIEW" as const, submittedAt: "2026-11-03T07:59:00Z" };
    expect(isOverdue(item, now)).toBe(true);
    expect(isOverdue({ ...item, submittedAt: "2026-11-03T08:01:00Z" }, now)).toBe(false);
    expect(isOverdue({ ...item, status: "VERIFIED" }, now)).toBe(false);
  });

  it("ngưỡng tự duyệt phải cao hơn ngưỡng đọc được", () => {
    expect(validateStudentRules(R)).toBeNull();
    expect(validateStudentRules({ ...R, autoApproveConfidence: 0.4 })).toMatch(/cao hơn/);
  });
});
