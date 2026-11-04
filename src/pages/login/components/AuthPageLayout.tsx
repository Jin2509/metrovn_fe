import type { ReactNode } from "react";
import { FutuMascot } from "@/components/brand/FutuMascot";
import { VietnamMap } from "@/components/brand/VietnamMap";

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <FutuMascot className="h-12 w-12 lg:h-14 lg:w-14" />
      <div>
        <p className="text-xl font-bold tracking-wide text-white">HopOn</p>
        <p className="text-xs text-sidebar-foreground/80">Cổng quản trị</p>
      </div>
    </div>
  );
}

/**
 * Khung chung của các trang chưa đăng nhập (đăng nhập, quên và đặt lại mật khẩu), cùng ngôn ngữ với màn
 * đăng nhập mobile: nền navy, bản đồ Việt Nam chìm phía sau, ô nhập trong mờ để bản đồ nhìn xuyên qua.
 * Bản rộng tách hai cột: thương hiệu và bản đồ bên trái, form bên phải. Bản hẹp xếp dọc như mobile.
 */
export function AuthPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="dark relative isolate min-h-screen overflow-hidden bg-[linear-gradient(160deg,#06192c_0%,#06192c_35%,#0a3a47_100%)] text-sidebar-foreground">
      {/* Bản hẹp: bản đồ rộng đúng màn hình như app. Không cắt mép để luôn thấy đủ Hoàng Sa, Trường Sa. */}
      <VietnamMap className="pointer-events-none absolute top-0 left-1/2 -z-10 w-full max-w-xl -translate-x-1/2 lg:hidden" />

      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-[1fr_minmax(0,27rem)] lg:gap-16 lg:px-10">
        <section className="relative flex flex-col justify-between px-6 pt-8 lg:px-0 lg:py-12">
          {/* Bản rộng: bản đồ nằm trong cột này nên form không bao giờ che quần đảo. */}
          <VietnamMap className="pointer-events-none absolute inset-y-0 left-0 -z-10 my-auto hidden max-h-[92vh] w-[calc(100%+3rem)] lg:block" />
          <BrandMark />
          <div className="hidden max-w-[17rem] space-y-4 lg:block">
            {/* Thương hiệu */}
            <p className="text-4xl font-extrabold tracking-wide text-white">HopOn</p>

            {/* Slogan */}
            <p className="text-2xl leading-tight font-bold text-white">
              Kỷ nguyên mới,
              <br />
              chuyển động mới
            </p>

            {/* Mô tả */}
            <p className="text-sm text-sidebar-foreground/80">
              Trang quản lý hệ thống đường sắt đô thị TP. Hồ Chí Minh
            </p>
          </div>
          <p className="hidden text-xs text-sidebar-foreground/60 lg:block">© 2026 HopOn</p>
        </section>
        <main className="flex flex-col justify-end px-6 pt-10 pb-8 lg:justify-center lg:px-0 lg:py-12">
          <div className="space-y-6 [&_input]:border-white/15 [&_input]:bg-white/[0.09] [&_input]:text-white [&_input]:placeholder:text-sidebar-foreground/55 lg:rounded-2xl lg:border lg:border-white/10 lg:bg-white/[0.05] lg:p-8 lg:shadow-2xl lg:shadow-black/30 lg:backdrop-blur-md">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-white">{title}</h1>
              <p className="text-sm text-sidebar-foreground/80">{description}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
