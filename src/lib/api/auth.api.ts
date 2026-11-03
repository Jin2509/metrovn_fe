import { apiRequest } from "./client";
import type { TokenResponse } from "./types";

// /api/auth: không cần token, chỉ nhận POST. Web không có đăng ký: tài khoản do Admin tạo.
const post = <T = void>(path: string, body: unknown) =>
  apiRequest<T>(`/api/auth/${path}`, { method: "POST", body, auth: false });

export const authApi = {
  verifyEmail: (body: { email: string; code: string }) => post("verify-email", body),
  resendCode: (email: string) => post("resend-code", { email }),
  login: (body: { email: string; password: string }) => post<TokenResponse>("login", body),
  /** Gửi kèm access token để nó bị thu hồi ngay; luôn trả 204 kể cả khi token đã hết hạn. */
  logout: (refreshToken: string, accessToken: string) =>
    apiRequest("/api/auth/logout", {
      method: "POST",
      body: { refreshToken },
      auth: false,
      token: accessToken,
    }),
  forgotPassword: (email: string) => post("forgot-password", { email }),
  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    post("reset-password", body),
};
