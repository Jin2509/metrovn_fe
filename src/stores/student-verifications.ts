import { createStore } from "@/lib/store";
import type { StudentVerificationStatus } from "@/lib/api";

// Xác nhận sinh viên. Dữ liệu thật: `studentVerificationsApi`, `studentPolicyApi`.
// AI đọc thẻ và đối chiếu quy tắc chạy ở backend; quản trị chỉ xem hồ sơ máy không tự quyết được.

export type StudentStatus = StudentVerificationStatus;

export type StudentVerification = {
  id: string;
  userId: string;
  accountName: string;
  accountEmail: string;
  status: StudentStatus;
  /** Thông tin hành khách tự khai. */
  declared: { fullName: string; studentCode: string; school: string };
  /** Thông tin AI đọc được từ ảnh thẻ (null khi chưa đọc hoặc lỗi). */
  ai: {
    isStudentCard: boolean | null;
    fullName: string | null;
    studentCode: string | null;
    school: string | null;
    validUntil: string | null;
    /** 0..1 */
    confidence: number | null;
    tamperingSuspected: boolean | null;
    notes: string | null;
    error: string | null;
    attempts: number;
  };
  decisionSource: "AI" | "MANUAL" | null;
  decisionReasons: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  approvedUntil: string | null;
  submittedAt: string;
  decidedAt: string | null;
  imageAvailable: boolean;
};

export const studentVerificationsStore = createStore<StudentVerification[]>([]);
