import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { FutuMascot } from "@/components/brand/FutuMascot";
import { VietnamMap } from "@/components/brand/VietnamMap";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Hiệu ứng mở màn chỉ chạy khi vừa mở web hoặc vừa đăng xuất, không chạy lại khi chuyển qua lại giữa
 * đăng nhập và quên mật khẩu. Sống ở cấp module vì mỗi trang mount một AuthPageLayout riêng.
 */
let introPlayed = false;

// Vị trí cố định (không random) để server và client render giống nhau.
const SPARKLES: { x: number; y: number; size: number; delay: number }[] = [
  { x: 6, y: 14, size: 14, delay: 200 },
  { x: 17, y: 58, size: 10, delay: 900 },
  { x: 9, y: 84, size: 16, delay: 500 },
  { x: 28, y: 9, size: 10, delay: 1200 },
  { x: 36, y: 32, size: 18, delay: 350 },
  { x: 44, y: 72, size: 12, delay: 1050 },
  { x: 52, y: 18, size: 12, delay: 650 },
  { x: 58, y: 91, size: 14, delay: 150 },
  { x: 66, y: 7, size: 16, delay: 800 },
  { x: 74, y: 88, size: 10, delay: 1300 },
  { x: 84, y: 11, size: 12, delay: 450 },
  { x: 91, y: 40, size: 16, delay: 1000 },
  { x: 96, y: 74, size: 12, delay: 300 },
  { x: 88, y: 94, size: 14, delay: 700 },
];

function Sparkles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {SPARKLES.map(({ x, y, size, delay }) => (
        <svg
          key={`${x}-${y}`}
          viewBox="0 0 24 24"
          className="auth-sparkle absolute text-white"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            animationDelay: `${delay}ms`,
          }}
        >
          <path
            fill="currentColor"
            d="M12 0c.9 7 4.1 10.9 12 12-7.9 1.1-11.1 5-12 12-.9-7-4.1-10.9-12-12 7.9-1.1 11.1-5 12-12z"
          />
        </svg>
      ))}
    </div>
  );
}

const riseAfter = (ms: number) => ({ "--auth-delay": `${ms}ms` }) as CSSProperties;

function BrandMark() {
  return (
    <div className="auth-rise flex items-center gap-3" style={riseAfter(0)}>
      <FutuMascot className="h-12 w-12 lg:h-14 lg:w-14" />
      <div>
        <p className="auth-shine text-xl font-bold tracking-wide text-white">HopOn</p>
        <p className="text-xs text-sidebar-foreground/100">Cổng quản trị</p>
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
  const { status } = useAuth();
  const [playIntro] = useState(() => !introPlayed);

  // Đăng nhập xong thì mở lại lượt mới, để lần đăng xuất sau hiệu ứng lại chạy.
  useEffect(() => {
    introPlayed = status !== "authenticated";
  }, [status]);

  return (
    <div
      className={cn(
        "dark relative isolate min-h-screen overflow-hidden bg-[linear-gradient(160deg,#06192c_0%,#06192c_35%,#0a3a47_100%)] text-sidebar-foreground",
        playIntro && "auth-intro",
      )}
    >
      {playIntro && <Sparkles />}

      {/* Bản hẹp: bản đồ rộng đúng màn hình như app. Không cắt mép để luôn thấy đủ Hoàng Sa, Trường Sa. */}
      <VietnamMap
        intro={playIntro}
        className="pointer-events-none absolute top-0 left-1/2 -z-10 w-full max-w-xl -translate-x-1/2 lg:hidden"
      />

      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-[1fr_minmax(0,27rem)] lg:gap-16 lg:px-10">
        <section className="relative flex flex-col justify-between px-6 pt-8 lg:px-0 lg:py-12">
          {/* Bản rộng: bản đồ nằm trong cột này nên form không bao giờ che quần đảo, và bắt đầu dưới logo để không đè chữ. */}
          <VietnamMap
            intro={playIntro}
            className="pointer-events-none absolute top-[6.75rem] bottom-8 left-0 -z-10 my-auto hidden max-h-[calc(100%-8.75rem)] w-[calc(100%+3rem)] lg:block"
          />
          <BrandMark />
          <div className="auth-rise hidden max-w-[17rem] space-y-4 lg:block" style={riseAfter(250)}>
            {/* Thương hiệu */}
            <p className="auth-shine text-4xl font-extrabold tracking-wide text-white">HopOn</p>

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
          <p
            className="auth-rise hidden text-xs text-sidebar-foreground/60 lg:block"
            style={riseAfter(500)}
          >
            © 2026 HopOn
          </p>
        </section>
        <main className="flex flex-col justify-end px-6 pt-10 pb-8 lg:justify-center lg:px-0 lg:py-12">
          <div
            style={riseAfter(150)}
            className="auth-rise auth-card space-y-6 [&_input]:border-white/15 [&_input]:bg-white/[0.09] [&_input]:text-white [&_input]:placeholder:text-sidebar-foreground/55 lg:rounded-2xl lg:border lg:border-white/10 lg:bg-white/[0.05] lg:p-8 lg:shadow-2xl lg:shadow-black/30 lg:backdrop-blur-md"
          >
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-white">{title}</h1>
              <p className="text-sm text-sidebar-foreground/100">{description}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
