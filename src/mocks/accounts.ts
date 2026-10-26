import type { SessionUser } from "@/lib/auth/auth.types";

// Tài khoản đăng nhập GIẢ LẬP cho giao diện quản trị — thay bằng API xác thực thật sau này.
export const DEMO_PASSWORD = "Metro@2026";

export type DemoAccount = SessionUser & { password: string };

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "ADM001",
    name: "Nguyễn Văn An",
    email: "admin@metro.vn",
    role: "ADMIN",
    password: DEMO_PASSWORD,
  },
  {
    id: "MGR001",
    name: "Trần Thị Bình",
    email: "manager@metro.vn",
    role: "MANAGER",
    password: DEMO_PASSWORD,
  },
  {
    id: "ACC001",
    name: "Lê Minh Châu",
    email: "accountant@metro.vn",
    role: "ACCOUNTANT",
    password: DEMO_PASSWORD,
  },
];
