import type { ReactNode } from "react";
import { ActiveWorkBanner } from "@/components/layout/ActiveWorkBanner";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useNetworkSync } from "@/pages/stations/hooks/useNetwork";

/**
 * Khung giao diện của mọi màn hình quản trị: sidebar + header + vùng nội dung.
 * Việc đăng nhập và chặn theo vai trò do `AuthGate` (route gốc) xử lý nên ở đây không cần kiểm tra lại.
 * `description` mặc định lấy từ mô tả của mục menu tương ứng (nav.config).
 */
export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  useNetworkSync();
  return (
    <div className="flex min-h-dvh bg-background">
      {/* Người dùng bàn phím bỏ qua menu dài để vào thẳng nội dung. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        Bỏ qua tới nội dung chính
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} description={description} actions={actions} />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-4 outline-none md:p-6 lg:p-8"
        >
          <ActiveWorkBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
