import { studentVerificationsApi, type StudentVerificationResponse } from "@/lib/api";
import { useSyncedQuery } from "@/lib/query-sync";
import {
  studentVerificationsStore,
  type StudentVerification,
} from "@/stores/student-verifications";

export { studentVerificationsStore };

export const STUDENTS_KEY = ["students"] as const;
export const STUDENT_POLICY_KEY = ["students", "policy"] as const;
/** Đủ cho màn hình theo dõi; backend phân trang. */
const FETCH_SIZE = 200;
/** Thời hạn xử lý hồ sơ cần xem xét, khớp câu "có thể mất đến 24 giờ" trên app. */
export const REVIEW_SLA_HOURS = 24;

export const toVerification = (v: StudentVerificationResponse): StudentVerification => ({
  id: v.id,
  userId: v.userId,
  accountName: v.userFullName,
  accountEmail: v.userEmail,
  status: v.status,
  declared: {
    fullName: v.declaredFullName,
    studentCode: v.declaredStudentCode,
    school: v.declaredSchool,
  },
  ai: {
    isStudentCard: v.aiIsStudentCard,
    fullName: v.aiFullName,
    studentCode: v.aiStudentCode,
    school: v.aiSchool,
    validUntil: v.aiValidUntil,
    confidence: v.aiConfidence,
    tamperingSuspected: v.aiTamperingSuspected,
    notes: v.aiNotes,
    error: v.aiError,
    attempts: v.aiAttempts,
  },
  decisionSource: v.decisionSource,
  decisionReasons: v.decisionReasons,
  reviewedBy: v.reviewedBy,
  reviewNote: v.reviewNote,
  approvedUntil: v.approvedUntil,
  submittedAt: v.submittedAt,
  decidedAt: v.decidedAt,
  imageAvailable: v.imageAvailable,
});

/** Hồ sơ mới nhất, đồng bộ vào `studentVerificationsStore`. Cần STUDENT_VERIFY. */
export function useStudentVerificationsData(enabled = true) {
  return useSyncedQuery({
    queryKey: STUDENTS_KEY,
    queryFn: () => studentVerificationsApi.list({ size: FETCH_SIZE }),
    store: studentVerificationsStore,
    map: (page) => page.content.map(toVerification),
    enabled,
  });
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
  const decided = items.filter((item) => item.decisionSource);
  const auto = decided.filter((item) => item.decisionSource === "AI").length;
  return {
    total: items.length,
    auto,
    autoRate: decided.length ? auto / decided.length : 0,
    needsReview: items.filter((item) => item.status === "NEEDS_REVIEW").length,
    verified: items.filter((item) => item.status === "APPROVED").length,
  };
}

/** Lý do backend ghi lại (chuỗi nhiều dòng) → danh sách để hiển thị. */
export const reasonsOf = (item: Pick<StudentVerification, "decisionReasons">) =>
  (item.decisionReasons ?? "")
    .split(/\n|;\s*/)
    .map((r) => r.trim())
    .filter(Boolean);
