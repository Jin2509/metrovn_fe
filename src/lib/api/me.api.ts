import { apiRequest } from "./client";
import type { MeResponse } from "./types";

// /api/me: cần token, không cần quyền riêng.
export const meApi = {
  /** Truyền `token` khi chưa có phiên (ngay sau khi đăng nhập). */
  get: (token?: string) =>
    apiRequest<MeResponse>("/api/me", token ? { auth: false, token } : undefined),
  /** Đổi email: họ tên đổi ngay, email chỉ đổi sau khi xác nhận OTP gửi tới email mới. */
  updateProfile: (body: { fullName: string; email?: string; currentPassword?: string }) =>
    apiRequest<MeResponse>("/api/me/profile", { method: "PUT", body }),
  /** Thành công: mọi token bị thu hồi, phải đăng nhập lại bằng email mới. */
  verifyEmailChange: (body: { email: string; code: string }) =>
    apiRequest<MeResponse>("/api/me/profile/verify-email", { method: "POST", body }),
  /** Thành công: mọi thiết bị, kể cả thiết bị hiện tại, phải đăng nhập lại. */
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiRequest("/api/me/password", { method: "PUT", body }),
};
