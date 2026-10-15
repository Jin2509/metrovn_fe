import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Bảng trạng thái — một nơi duy nhất (status-map)
const statusMap: Record<string, [string, string]> = {
  ACTIVE: ["Hoạt động", "bg-success/15 text-success"],
  INACTIVE: ["Ngừng", "bg-muted text-muted-foreground"],
  LOCKED: ["Đã khóa", "bg-destructive/15 text-destructive"],
  DRAFT: ["Nháp", "bg-secondary text-secondary-foreground"],
  EXPIRED: ["Hết hạn", "bg-muted text-muted-foreground"],
  PENDING: ["Chờ duyệt", "bg-accent/20 text-accent-foreground"],
  APPROVED: ["Đã duyệt", "bg-success/15 text-success"],
  REJECTED: ["Từ chối", "bg-destructive/15 text-destructive"],
  SUCCESS: ["Thành công", "bg-success/15 text-success"],
  FAILED: ["Thất bại", "bg-destructive/15 text-destructive"],
  REFUNDED: ["Hoàn tiền", "bg-primary/15 text-primary"],
  MAINTENANCE: ["Bảo trì", "bg-accent/20 text-accent-foreground"],
  RECONCILED: ["Đã đối soát", "bg-success/15 text-success"],
  UNRECONCILED: ["Chưa đối soát", "bg-muted text-muted-foreground"],
};
export function StatusBadge({ s, label }: { s: string; label?: string }) {
  const [l, c] = statusMap[s] ?? [s, "bg-muted"];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", c)}>
      {label ?? l}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export type Col<T> = { h: string; c: (r: T) => ReactNode; className?: string };
export function DataTable<T>({
  rows,
  cols,
  pageSize = 10,
  onRow,
  empty = "Không có dữ liệu",
}: {
  rows: T[];
  cols: Col<T>[];
  pageSize?: number;
  onRow?: (r: T) => void;
  empty?: string;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const p = Math.min(page, pages - 1);
  const view = rows.slice(p * pageSize, (p + 1) * pageSize);
  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((c) => (
                <TableHead key={c.h} className={c.className}>
                  {c.h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={cols.length}
                  className="py-10 text-center text-muted-foreground"
                >
                  {empty}
                </TableCell>
              </TableRow>
            )}
            {view.map((r, i) => (
              <TableRow
                key={i}
                onClick={onRow ? () => onRow(r) : undefined}
                className={onRow ? "cursor-pointer" : ""}
              >
                {cols.map((c) => (
                  <TableCell key={c.h} className={c.className}>
                    {c.c(r)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">
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
        </div>
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
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  confirmLabel?: string;
}) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setReason("");
          setErr("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Nhập lý do (bắt buộc)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={() => {
              if (!reason.trim()) return setErr("Vui lòng nhập lý do");
              onConfirm(reason.trim());
              setReason("");
              setErr("");
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const money = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";
