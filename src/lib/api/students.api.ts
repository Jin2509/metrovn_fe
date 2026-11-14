import { apiRequest } from "./client";
import { V1, seg } from "./path";
import type {
  Page,
  StudentPolicy,
  StudentVerificationQuery,
  StudentVerificationResponse,
  UpdateStudentPolicyBody,
} from "./types";

// Xác thực sinh viên: xem/duyệt cần STUDENT_VERIFY, sửa chính sách cần STUDENT_POLICY_MANAGE.
const ADMIN = `${V1}/admin`;
const verification = (id: string, action?: string) =>
  `${ADMIN}/student-verifications/${seg(id)}${action ? `/${action}` : ""}`;

export const studentVerificationsApi = {
  list: (query: StudentVerificationQuery = {}) =>
    apiRequest<Page<StudentVerificationResponse>>(`${ADMIN}/student-verifications`, { query }),
  get: (id: string) => apiRequest<StudentVerificationResponse>(verification(id)),
  /** Ảnh thẻ (khi `imageAvailable`). Dùng `URL.createObjectURL` để hiển thị. */
  image: (id: string) => apiRequest<Blob>(verification(id, "image"), { responseType: "blob" }),
  /** `approvedUntil` (yyyy-MM-dd) bỏ trống: backend tính theo chính sách và hạn thẻ. */
  approve: (id: string, body: { approvedUntil?: string; note?: string } = {}) =>
    apiRequest<StudentVerificationResponse>(verification(id, "approve"), {
      method: "POST",
      body,
    }),
  reject: (id: string, reason: string) =>
    apiRequest<StudentVerificationResponse>(verification(id, "reject"), {
      method: "POST",
      body: { reason },
    }),
  /** Thu hồi xác thực đã duyệt. */
  revoke: (id: string, reason: string) =>
    apiRequest<StudentVerificationResponse>(verification(id, "revoke"), {
      method: "POST",
      body: { reason },
    }),
  /** Cho AI đọc lại ảnh thẻ (khi lần trước lỗi). */
  retryAi: (id: string) =>
    apiRequest<StudentVerificationResponse>(verification(id, "retry-ai"), { method: "POST" }),
};

export const studentPolicyApi = {
  get: () => apiRequest<StudentPolicy>(`${ADMIN}/student-policy`),
  /** 409 khi `version` đã cũ. */
  update: (body: UpdateStudentPolicyBody) =>
    apiRequest<StudentPolicy>(`${ADMIN}/student-policy`, { method: "PUT", body }),
};
