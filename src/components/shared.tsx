import { ChevronRight } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { FieldError } from "@/components/form-field";
import { fieldErrorProps } from "@/components/form-field.utils";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Bảng trạng thái — một nơi duy nhất (status-map)
const statusMap: Record<string, [string, string]> = {
  ACTIVE: ["Hoạt động", "bg-success/15 text-success"],
  INACTIVE: ["Ngừng", "bg-muted text-muted-foreground"],
  LOCKED: ["Đã khóa", "bg-destructive/15 text-destructive"],
  DRAFT: ["Nháp", "bg-secondary text-secondary-foreground"],
  EXPIRED: ["Hết hạn", "bg-muted text-muted-foreground"],
  PENDING: ["Chờ duyệt", "bg-accent/20 text-accent-foreground"],
  PENDING_VERIFICATION: ["Chưa xác thực", "bg-accent/20 text-accent-foreground"],
  APPROVED: ["Đã duyệt", "bg-success/15 text-success"],
  REJECTED: ["Từ chối", "bg-destructive/15 text-destructive"],
  SUCCESS: ["Thành công", "bg-success/15 text-success"],
  FAILED: ["Thất bại", "bg-destructive/15 text-destructive"],
  REFUNDED: ["Hoàn tiền", "bg-primary/15 text-primary"],
  MAINTENANCE: ["Bảo trì", "bg-accent/20 text-accent-foreground"],
  RECONCILED: ["Đã đối soát", "bg-success/15 text-success"],
  UNRECONCILED: ["Chưa đối soát", "bg-muted text-muted-foreground"],
  SCHEDULED: ["Đã lên lịch", "bg-primary/15 text-primary"],
  PENDING_APPROVAL: ["Chờ duyệt", "bg-accent/20 text-accent-foreground"],
  APPLIED: ["Đã áp dụng", "bg-success/15 text-success"],
  SENDING: ["Đang gửi", "bg-primary/15 text-primary"],
  SENT: ["Đã gửi", "bg-success/15 text-success"],
  CANCELLED: ["Đã hủy", "bg-muted text-muted-foreground"],
  PROCESSING: ["AI đang đọc", "bg-primary/15 text-primary"],
  REVOKED: ["Đã thu hồi", "bg-destructive/15 text-destructive"],
  // Thông báo & chatbot
  ADDED: ["Đã thêm vào kho tri thức", "bg-success/15 text-success"],
  IGNORED: ["Bỏ qua", "bg-muted text-muted-foreground"],
  // Sự cố tại ga
  OPEN: ["Mới", "bg-destructive/15 text-destructive"],
  NEW: ["Mới", "bg-destructive/15 text-destructive"],
  IN_PROGRESS: ["Đang xử lý", "bg-accent/20 text-accent-foreground"],
  RESOLVED: ["Đã xử lý", "bg-success/15 text-success"],
  PUBLISHED: ["Đang hiện", "bg-primary/15 text-primary"],
  // Xác nhận sinh viên
  VERIFIED: ["Đã xác nhận", "bg-success/15 text-success"],
  NEEDS_REVIEW: ["Cần xem xét", "bg-accent/20 text-accent-foreground"],
};
export function StatusBadge({ s, label }: { s: string; label?: string }) {
  const [l, c] = statusMap[s] ?? [s, "bg-muted"];
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap border-transparent font-medium", c)}>
      {label ?? l}
    </Badge>
  );
}

const statTones = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-accent-foreground",
  success: "bg-success/12 text-success",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof statTones;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              statTones[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type SectionContextValue = { level: number; titleId?: string };
/** Cấp heading và id tiêu đề của Section bao ngoài; trang đã có `<h1>` ở Header nên bắt đầu từ 1. */
const SectionContext = createContext<SectionContextValue>({ level: 1 });

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const parent = useContext(SectionContext);
  const level = Math.min(parent.level + 1, 6);
  const Heading = `h${level}` as "h2";
  const titleId = useId();
  const descriptionId = useId();
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 border-b px-5 py-4">
        <div className="min-w-0 space-y-1">
          <Heading id={titleId} className="text-base font-semibold leading-none tracking-tight">
            {title}
          </Heading>
          {description && <CardDescription id={descriptionId}>{description}</CardDescription>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </CardHeader>
      <CardContent className="p-5">
        <SectionContext.Provider value={{ level, titleId }}>{children}</SectionContext.Provider>
      </CardContent>
    </Card>
  );
}

/** Bấm vào nút, ô nhập, link... bên trong dòng thì không mở dòng. */
const INTERACTIVE = "a, button, input, select, textarea, label, [role='checkbox'], [role='switch']";

/** Chỉ cho khung bảng vào thứ tự Tab khi bảng thật sự cuộn ngang, để người dùng bàn phím cuộn được. */
function useScrollable<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setScrollable(el.scrollWidth > el.clientWidth + 1);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    update();
    return () => observer.disconnect();
  }, []);
  return { ref, scrollable };
}

export type Col<T> = { h: string; c: (r: T) => ReactNode; className?: string };
export function DataTable<T>({
  rows,
  cols,
  pageSize = 10,
  onRow,
  rowActionLabel,
  rowKey,
  label,
  empty = "Không có dữ liệu",
}: {
  rows: T[];
  cols: Col<T>[];
  pageSize?: number;
  /** Mở một dòng. Cả dòng bấm được bằng chuột; bàn phím dùng nút ở cuối dòng. */
  onRow?: (r: T) => void;
  /** Tên của nút mở dòng, vd. `Xem chi tiết ga Bến Thành`. Trả về `null` nếu dòng đó không mở được. */
  rowActionLabel?: (r: T) => string | null;
  rowKey?: (r: T) => string | number;
  /** Tên bảng cho trình đọc màn hình. Mặc định lấy tiêu đề của Section bao ngoài. */
  label?: string;
  empty?: string;
}) {
  const [page, setPage] = useState(0);
  const { titleId } = useContext(SectionContext);
  const { ref, scrollable } = useScrollable<HTMLDivElement>();
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const p = Math.min(page, pages - 1);
  const view = rows.slice(p * pageSize, (p + 1) * pageSize);
  const named = label ? { "aria-label": label } : titleId ? { "aria-labelledby": titleId } : {};
  const actionLabel = (r: T, index: number) =>
    rowActionLabel ? rowActionLabel(r) : `Xem chi tiết dòng ${p * pageSize + index + 1}`;
  const colCount = cols.length + (onRow ? 1 : 0);

  return (
    <div>
      <div
        ref={ref}
        {...(scrollable ? { tabIndex: 0, role: "region", ...named } : {})}
        className="data-table-wrap overflow-x-auto rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <table
          {...named}
          className={cn("data-table w-full caption-bottom text-sm", cols.length <= 2 && "no-stack")}
        >
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              {cols.map((c) => (
                <TableHead
                  key={c.h}
                  scope="col"
                  className={cn("h-10 text-xs font-semibold uppercase tracking-wide", c.className)}
                >
                  {c.h}
                </TableHead>
              ))}
              {onRow && (
                <TableHead scope="col" className="h-10 w-12">
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.length === 0 && (
              <TableRow>
                <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                  {empty}
                </TableCell>
              </TableRow>
            )}
            {view.map((r, i) => {
              const name = onRow ? actionLabel(r, i) : null;
              return (
                <TableRow
                  key={rowKey ? rowKey(r) : i}
                  onClick={
                    onRow && name
                      ? (event) => {
                          const target = event.target as HTMLElement;
                          if (target.closest(INTERACTIVE)) return;
                          onRow(r);
                        }
                      : undefined
                  }
                  className={cn(onRow && name && "cursor-pointer")}
                >
                  {cols.map((c) => (
                    <TableCell key={c.h} data-label={c.h} className={c.className}>
                      {c.c(r)}
                    </TableCell>
                  ))}
                  {onRow && (
                    <TableCell className="row-action w-12 py-1 text-right">
                      {name && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={name}
                          onClick={() => onRow(r)}
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      </div>
      {pages > 1 && (
        <nav
          aria-label={label ? `Phân trang ${label}` : "Phân trang"}
          className="mt-3 flex items-center justify-end gap-2 text-sm"
        >
          <span className="text-muted-foreground" aria-live="polite">
            Trang {p + 1}/{pages} · {rows.length} dòng
          </span>
          <Button size="sm" variant="outline" disabled={p === 0} onClick={() => setPage(p - 1)}>
            Trước
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={p >= pages - 1}
            onClick={() => setPage(p + 1)}
          >
            Sau
          </Button>
        </nav>
      )}
    </div>
  );
}

export function ReasonDialog({
  open,
  title,
  onClose,
  onConfirm,
  confirmLabel = "Xác nhận",
  fieldLabel = "Lý do",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  confirmLabel?: string;
  /** Nhãn của ô nhập, mặc định "Lý do". */
  fieldLabel?: string;
}) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const fieldId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reset = () => {
    setReason("");
    setErr("");
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!reason.trim()) {
              setErr(`Vui lòng nhập ${fieldLabel.toLowerCase()}`);
              textareaRef.current?.focus();
              return;
            }
            onConfirm(reason.trim());
            reset();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor={fieldId}>
              {fieldLabel} <span aria-hidden>*</span>
            </Label>
            <Textarea
              ref={textareaRef}
              id={fieldId}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (err && e.target.value.trim()) setErr("");
              }}
              {...fieldErrorProps(fieldId, err)}
            />
            <FieldError fieldId={fieldId}>{err}</FieldError>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">{confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const money = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " VND";

/** Thông báo đang tải / lỗi tải dùng chung cho các bảng lấy dữ liệu từ API. */
export function LoadState({
  loading,
  error,
  onRetry,
}: {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  if (error)
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
      >
        Không tải được dữ liệu: {error}
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </div>
    );
  if (loading)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Đang tải dữ liệu…
      </p>
    );
  return null;
}

/** Phân trang khi backend trả từng trang (`Page<T>`); `page` bắt đầu từ 0. */
export function ServerPager({
  page,
  totalPages,
  totalElements,
  onChange,
  label,
  disabled,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onChange: (page: number) => void;
  label?: string;
  disabled?: boolean;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label={label ? `Phân trang ${label}` : "Phân trang"}
      className="mt-3 flex items-center justify-end gap-2 text-sm"
    >
      <span className="text-muted-foreground" aria-live="polite">
        Trang {page + 1}/{totalPages} · {totalElements.toLocaleString("vi-VN")} dòng
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || page === 0}
        onClick={() => onChange(page - 1)}
      >
        Trước
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </Button>
    </nav>
  );
}
