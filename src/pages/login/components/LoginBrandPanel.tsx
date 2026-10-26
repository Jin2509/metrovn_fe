import { Calculator, ClipboardCheck, ShieldCheck, TrainFront, type LucideIcon } from "lucide-react";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<Role, LucideIcon> = {
  ADMIN: ShieldCheck,
  MANAGER: ClipboardCheck,
  ACCOUNTANT: Calculator,
};

/** Sơ đồ tuyến minh họa (trang trí) dùng đúng màu thương hiệu của sidebar. */
function LineIllustration() {
  const stops = [16, 76, 136, 196, 256, 316];
  return (
    <svg
      viewBox="0 0 332 64"
      role="img"
      aria-label="Sơ đồ tuyến Metro số 1 từ Bến Thành đến Suối Tiên"
      className="w-full max-w-sm"
    >
      <line
        x1={stops[0]}
        x2={stops[stops.length - 1]}
        y1={24}
        y2={24}
        stroke="var(--sidebar-primary)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {stops.map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy={24}
          r={i === 0 ? 9 : 6}
          fill="var(--sidebar)"
          stroke={i === 0 ? "var(--accent)" : "var(--sidebar-primary)"}
          strokeWidth={3}
        />
      ))}
      <text x={stops[0]} y={54} textAnchor="start" className="fill-current text-[11px] opacity-70">
        Bến Thành
      </text>
      <text
        x={stops[stops.length - 1]}
        y={54}
        textAnchor="end"
        className="fill-current text-[11px] opacity-70"
      >
        Suối Tiên
      </text>
    </svg>
  );
}

export function LoginBrandPanel({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "flex-col justify-between bg-sidebar p-10 text-sidebar-foreground xl:p-14",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <TrainFront className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-sidebar-accent-foreground">Metro Admin</p>
          <p className="text-xs opacity-60">TP. Hồ Chí Minh</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold leading-tight text-sidebar-accent-foreground">
            Điều hành Metro TP.HCM
            <br />
            trên một màn hình
          </h2>
          <p className="max-w-md text-sm opacity-70">
            Quản lý mạng lưới, vé, giao dịch và phê duyệt thay đổi — mỗi vai trò chỉ thấy đúng phần
            việc của mình.
          </p>
        </div>
        <LineIllustration />
        <ul className="space-y-4">
          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
            const Icon = ROLE_ICONS[role];
            return (
              <li key={role} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-sidebar-accent-foreground">
                    {ROLE_LABELS[role]}
                  </span>
                  <span className="opacity-70">{ROLE_DESCRIPTIONS[role]}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs opacity-50">© 2026 Metro TP. Hồ Chí Minh</p>
    </section>
  );
}
