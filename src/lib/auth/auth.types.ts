// Kiểu dữ liệu dùng chung cho xác thực & phân quyền.

export type Role = "ADMIN" | "MANAGER" | "ACCOUNTANT";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  /** Vai trò dùng để chặn route ở web, suy ra từ `GET /api/me` (xem `resolveRole`). */
  role: Role;
  /** Mã quyền từ backend. Có thể đổi bất kỳ lúc nào nên được tải lại từ `GET /api/me`. */
  permissions: string[];
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export type Session = SessionTokens & {
  user: SessionUser;
  /** Hạn của refresh token (ms). Sau mốc này phải đăng nhập lại. */
  expiresAt: number;
};

export type AuthStatus = "loading" | "anonymous" | "authenticated";

export type AuthState = {
  status: AuthStatus;
  user: SessionUser | null;
  /** Lý do phiên kết thúc — dùng để quyết định có nhớ trang đang xem khi chuyển về /login hay không. */
  endedBy?: "logout" | "expired";
};

export type LoginInput = {
  email: string;
  password: string;
  remember: boolean;
};
