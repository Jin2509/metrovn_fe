import { FutuMascot } from "@/components/brand/FutuMascot";

/** Màn hình chờ khi đang đọc phiên đăng nhập hoặc đang chuyển hướng. */
export function AuthSplash() {
  return (
    <div
      role="status"
      aria-label="Đang kiểm tra phiên đăng nhập"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <FutuMascot className="h-16 w-16 animate-pulse" />
    </div>
  );
}
