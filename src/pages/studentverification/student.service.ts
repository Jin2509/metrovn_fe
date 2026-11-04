import { getActorName } from "@/lib/auth/session.store";
import { createStore } from "@/lib/store";
import { logAction } from "@/mocks/admin";
import {
  DEFAULT_STUDENT_RULES,
  SEED_SUBMISSIONS,
  studentRulesStore,
  type StudentCardData,
  type StudentRules,
  type StudentStatus,
  type StudentSubmission,
  type StudentVerification,
} from "@/mocks/student-verifications";

// Quy tắc tự động: phần lớn hồ sơ do hệ thống tự quyết, người chỉ xem hồ sơ máy không chắc.
// Khi có backend, hàm này chạy ở backend ngay sau khi AI đọc xong thẻ.

/** Thời hạn xử lý hồ sơ cần xem xét, khớp câu "có thể mất đến 24 giờ" trên app. */
export const REVIEW_SLA_HOURS = 24;

const normalizeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const dateOnly = (value: Date) => value.toISOString().slice(0, 10);

function addMonths(from: Date, months: number) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + months);
  return next;
}

/** Ưu đãi hết hiệu lực khi hết thời hạn xác nhận hoặc hết hạn thẻ, tùy mốc nào đến trước. */
export function expiryOf(card: StudentCardData, rules: StudentRules, now: Date) {
  const limit = dateOnly(addMonths(now, rules.validityMonths));
  return card.cardExpiry && card.cardExpiry < limit ? card.cardExpiry : limit;
}

export type StudentDecision = {
  status: "VERIFIED" | "REJECTED" | "NEEDS_REVIEW";
  reasons: string[];
};

/**
 * Ba hướng xử lý:
 * - Từ chối ngay khi lỗi rõ ràng, hành khách tự sửa được (ảnh mờ, thẻ hết hạn).
 * - Chuyển người xem khi có điểm nghi ngờ mà máy không nên tự kết luận.
 * - Còn lại tự duyệt.
 */
export function evaluateSubmission(
  submission: StudentSubmission,
  rules: StudentRules,
  /** Tài khoản khác đã dùng mã sinh viên này chưa. */
  codeUsedByAnother: boolean,
  now: Date,
): StudentDecision {
  const { card, confidence } = submission;
  if (
    confidence < rules.minReadableConfidence ||
    !card.fullName ||
    !card.school ||
    !card.studentCode ||
    !card.cardExpiry
  )
    return {
      status: "REJECTED",
      reasons: ["Ảnh mờ nên chưa đọc được đủ thông tin thẻ. Chụp lại nơi đủ sáng nha."],
    };
  if (card.cardExpiry < dateOnly(now))
    return { status: "REJECTED", reasons: ["Thẻ sinh viên đã hết hạn."] };

  const reasons: string[] = [];
  if (confidence < rules.autoApproveConfidence)
    reasons.push(`AI đọc thẻ chưa đủ chắc chắn (${Math.round(confidence * 100)}%).`);
  if (!rules.schools.includes(card.school))
    reasons.push(`Trường "${card.school}" chưa có trong danh sách.`);
  if (normalizeName(card.fullName) !== normalizeName(submission.accountName))
    reasons.push(`Tên trên thẻ "${card.fullName}" khác tên tài khoản.`);
  if (codeUsedByAnother) reasons.push(`Mã sinh viên ${card.studentCode} đã dùng ở tài khoản khác.`);

  return reasons.length ? { status: "NEEDS_REVIEW", reasons } : { status: "VERIFIED", reasons: [] };
}

/** Chạy lần lượt theo thời gian gửi: thẻ gửi trước giữ mã sinh viên, thẻ sau bị coi là trùng. */
export function processSubmissions(
  submissions: StudentSubmission[],
  rules: StudentRules,
  now: Date,
): StudentVerification[] {
  const codeOwner = new Map<string, string>();
  return [...submissions]
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .map((submission) => {
      const code = submission.card.studentCode;
      const owner = code ? codeOwner.get(code) : undefined;
      const decision = evaluateSubmission(
        submission,
        rules,
        !!owner && owner !== submission.accountEmail,
        now,
      );
      if (code && !owner && decision.status !== "REJECTED")
        codeOwner.set(code, submission.accountEmail);
      const decided = decision.status !== "NEEDS_REVIEW";
      return {
        ...submission,
        status: decision.status,
        reasons: decision.reasons,
        decidedBy: null,
        decidedAt: decided ? submission.submittedAt : null,
        expiresAt: decision.status === "VERIFIED" ? expiryOf(submission.card, rules, now) : null,
      };
    })
    .reverse();
}

export const studentVerificationsStore = createStore<StudentVerification[]>(
  processSubmissions(SEED_SUBMISSIONS, DEFAULT_STUDENT_RULES, new Date()),
);

/** App mobile chỉ có các trạng thái của `StudentStatus` phía app; đang xem xét vẫn là chờ duyệt. */
export function toPassengerStatus(status: StudentStatus) {
  return status === "NEEDS_REVIEW" ? "PENDING" : status;
}

export function isOverdue(
  item: Pick<StudentVerification, "status" | "submittedAt">,
  now = new Date(),
) {
  return (
    item.status === "NEEDS_REVIEW" &&
    now.getTime() - new Date(item.submittedAt).getTime() > REVIEW_SLA_HOURS * 3_600_000
  );
}

export function studentStats(items: StudentVerification[]) {
  const auto = items.filter((item) => item.status !== "NEEDS_REVIEW" && !item.decidedBy).length;
  return {
    total: items.length,
    auto,
    autoRate: items.length ? auto / items.length : 0,
    needsReview: items.filter((item) => item.status === "NEEDS_REVIEW").length,
    verified: items.filter((item) => item.status === "VERIFIED").length,
  };
}

function decide(id: string, patch: Partial<StudentVerification>) {
  studentVerificationsStore.set((items) =>
    items.map((item) =>
      item.id === id
        ? { ...item, ...patch, decidedBy: getActorName(), decidedAt: new Date().toISOString() }
        : item,
    ),
  );
}

export function approveStudent(item: StudentVerification, now = new Date()) {
  decide(item.id, {
    status: "VERIFIED",
    expiresAt: expiryOf(item.card, studentRulesStore.get(), now),
  });
  logAction("Duyệt xác nhận sinh viên", item.id);
}

export function rejectStudent(item: StudentVerification, reason: string) {
  decide(item.id, { status: "REJECTED", reasons: [reason] });
  logAction("Từ chối xác nhận sinh viên", item.id);
}

export function validateStudentRules(rules: StudentRules): string | null {
  const isRatio = (value: number) => value > 0 && value <= 1;
  if (!isRatio(rules.autoApproveConfidence) || !isRatio(rules.minReadableConfidence))
    return "Độ tin cậy phải từ 1 đến 100%.";
  if (rules.minReadableConfidence >= rules.autoApproveConfidence)
    return "Ngưỡng tự duyệt phải cao hơn ngưỡng đọc được.";
  if (!(rules.validityMonths >= 1)) return "Thời hạn xác nhận phải từ 1 tháng.";
  if (!(rules.renewWithinDays >= 1)) return "Số ngày nhắc gia hạn phải từ 1 ngày.";
  if (!rules.schools.length) return "Danh sách trường không được trống.";
  return null;
}

export function saveStudentRules(rules: StudentRules): string | null {
  const error = validateStudentRules(rules);
  if (error) return error;
  studentRulesStore.set(() => rules);
  logAction("Cập nhật quy tắc xác nhận sinh viên", "Áp dụng cho hồ sơ gửi sau");
  return null;
}
