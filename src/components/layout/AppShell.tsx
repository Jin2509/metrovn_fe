import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

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
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} description={description} actions={actions} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
