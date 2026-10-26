import { TrainFront } from "lucide-react";

/** Màn hình chờ khi đang đọc phiên đăng nhập hoặc đang chuyển hướng. */
export function AuthSplash() {
  return (
    <div
      role="status"
      aria-label="Đang kiểm tra phiên đăng nhập"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <TrainFront className="h-6 w-6" />
      </div>
    </div>
  );
}
