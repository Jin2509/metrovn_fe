// Kiểu dữ liệu dùng chung cho xác thực & phân quyền.

export type Role = "ADMIN" | "MANAGER" | "ACCOUNTANT";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Session = {
  user: SessionUser;
  issuedAt: number;
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
