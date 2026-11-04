import { ClientOnly } from "@tanstack/react-router";
import { Suspense, type ReactNode } from "react";

/**
 * Khung giữ chỗ cho biểu đồ tải chậm (`lazy`). Thư viện biểu đồ là phần nặng nhất của trang nên không
 * để nó chặn nội dung khác; chiều cao cố định giúp trang không bị nhảy khi biểu đồ hiện ra.
 */
export function ChartBoundary({ className, children }: { className: string; children: ReactNode }) {
  const fallback = <div className="h-full animate-pulse rounded-lg bg-muted/60" />;
  return (
    <div className={className}>
      <ClientOnly fallback={fallback}>
        <Suspense fallback={fallback}>{children}</Suspense>
      </ClientOnly>
    </div>
  );
}
