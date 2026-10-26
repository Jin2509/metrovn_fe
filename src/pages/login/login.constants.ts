import type { LoginDraft } from "@/pages/login/login.types";

export const EMPTY_LOGIN_DRAFT: LoginDraft = { email: "", password: "", remember: true };

/**
 * Hiện danh sách tài khoản demo ở trang đăng nhập (bấm để điền sẵn).
 * Tắt bằng biến môi trường VITE_SHOW_DEMO_ACCOUNTS=false khi triển khai thật.
 */
export const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== "false";
