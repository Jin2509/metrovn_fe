import {
  Calculator,
  Check,
  ClipboardCheck,
  Minus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES, type Role } from "@/lib/auth";
import {
  buildActionMatrix,
  buildScreenMatrix,
  type MatrixRow,
} from "@/pages/settings/settings.service";

const ROLE_ICONS: Record<Role, LucideIcon> = {
  ADMIN: ShieldCheck,
  MANAGER: ClipboardCheck,
  ACCOUNTANT: Calculator,
};

function Matrix({ rows, firstHeader }: { rows: MatrixRow[]; firstHeader: string }) {
  let lastGroup = "";
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 min-w-48 text-xs font-semibold uppercase tracking-wide">
              {firstHeader}
            </TableHead>
            {ROLES.map((r) => (
              <TableHead key={r} className="h-10 w-24 text-center text-xs font-semibold uppercase">
                {ROLE_LABELS[r]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const showGroup = row.group !== lastGroup && rows.some((r) => r.group !== row.group);
            lastGroup = row.group;
            return (
              <TableRow key={row.key}>
                <TableCell>
                  {showGroup && (
                    <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {row.group}
                    </span>
                  )}
                  <span className="font-medium">{row.label}</span>
                </TableCell>
                {ROLES.map((r) => (
                  <TableCell key={r} className="text-center">
                    {row.roles[r] ? (
                      <Check className="mx-auto h-4 w-4 text-success" aria-label="Được phép" />
                    ) : (
                      <Minus
                        className="mx-auto h-4 w-4 text-muted-foreground/50"
                        aria-label="Không"
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** Tab "Vai trò & phân quyền" — chỉ đọc, sinh trực tiếp từ permissions.ts nên luôn khớp với app. */
export function RoleMatrixPanel() {
  const screens = buildScreenMatrix();
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {ROLES.map((r) => {
          const Icon = ROLE_ICONS[r];
          return (
            <Card key={r}>
              <CardContent className="flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{ROLE_LABELS[r]}</p>
                  <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {screens.filter((s) => s.roles[r]).length}/{screens.length} màn hình
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Section
          title="Quyền truy cập màn hình"
          description="Menu, đường dẫn và kiểm tra quyền đều đọc từ cùng một nguồn"
        >
          <Matrix rows={screens} firstHeader="Màn hình" />
        </Section>
        <Section
          title="Thao tác nhạy cảm"
          description="Ẩn nút hoặc tab bên trong màn hình theo vai trò"
        >
          <Matrix rows={buildActionMatrix()} firstHeader="Thao tác" />
          <p className="mt-3 text-xs text-muted-foreground">
            Hành khách và nhân viên soát vé dùng app di động, không đăng nhập web quản trị. Đổi phân
            quyền cần cập nhật cả máy chủ, vì giao diện chỉ ẩn/hiện chức năng.
          </p>
        </Section>
      </div>
    </>
  );
}
