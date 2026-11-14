import { apiRequest } from "./client";
import type { LoginResponse, TokenResponse } from "./types";

// /api/auth: không cần token, chỉ nhận POST. Web không có đăng ký: tài khoản do Admin tạo.
const post = <T = void>(path: string, body: unknown) =>
  apiRequest<T>(`/api/auth/${path}`, { method: "POST", body, auth: false });

export const authApi = {
  verifyEmail: (body: { email: string; code: string }) => post("verify-email", body),
  resendCode: (email: string) => post("resend-code", { email }),
  /** Tài khoản bật 2FA nhận `TwoFactorChallengeResponse` thay vì token (xem `isTwoFactorChallenge`). */
  login: (body: { email: string; password: string }) => post<LoginResponse>("login", body),
  /** Bước 2 của đăng nhập 2FA: `code` gồm 6 chữ số gửi qua email. */
  verifyLoginCode: (body: { ticket: string; code: string }) =>
    post<TokenResponse>("login/2fa", body),
  resendLoginCode: (ticket: string) => post("login/2fa/resend", { ticket }),
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
