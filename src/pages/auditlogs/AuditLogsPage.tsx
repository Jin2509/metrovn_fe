import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable, Section } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuthEventType } from "@/lib/api";
import {
  AUDIT_ACTIONS,
  auditActionLabel,
  auditActorName,
  formatAuditTime,
} from "@/pages/auditlogs/auditlogs.service";
import { useAuditLogs } from "@/pages/auditlogs/hooks/useAuditLogs";

export function AuditLogsPage() {
  const logs = useAuditLogs();
  return (
    <AppShell title="Nhật ký hệ thống">
      <Section title="Nhật ký bảo mật tài khoản">
        <div className="mb-3 flex flex-wrap gap-2">
          <Input
            className="w-64"
            placeholder="Tìm theo email hoặc họ tên"
            aria-label="Tìm theo email hoặc họ tên"
            value={logs.query}
            onChange={(e) => logs.setQuery(e.target.value)}
          />
          <Select
            value={logs.type}
            onValueChange={(value) => logs.setType(value as AuthEventType | "ALL")}
          >
            <SelectTrigger className="w-56" aria-label="Lọc theo hành động">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi hành động</SelectItem>
              {AUDIT_ACTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {auditActionLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-44"
            aria-label="Lọc theo ngày"
            value={logs.day}
            onChange={(e) => logs.setDay(e.target.value)}
          />
          <Button variant="outline" onClick={logs.refresh} disabled={logs.refreshing}>
            <RefreshCw className={logs.refreshing ? "animate-spin" : undefined} />
            Tải lại
          </Button>
        </div>
        {logs.loadError && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{logs.loadError}</AlertDescription>
          </Alert>
        )}
        <DataTable
          rows={logs.rows}
          pageSize={logs.pageSize}
          empty={logs.loading ? "Đang tải nhật ký…" : "Không có nhật ký phù hợp"}
          cols={[
            { h: "Thời gian", c: (l) => formatAuditTime(l.createdAt) },
            { h: "Người thực hiện", c: auditActorName },
            { h: "Hành động", c: (l) => <b>{auditActionLabel(l.type)}</b> },
            { h: "Tài khoản", c: (l) => l.user?.email ?? "—" },
            {
              h: "Địa chỉ IP",
              c: (l) => <span title={l.userAgent ?? undefined}>{l.ipAddress ?? "—"}</span>,
            },
          ]}
        />
        {logs.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-end gap-2 text-sm">
            <span className="text-muted-foreground">
              Trang {logs.page + 1}/{logs.totalPages} · {logs.total} dòng
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={logs.page === 0}
              onClick={() => logs.setPage(logs.page - 1)}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={logs.page >= logs.totalPages - 1}
              onClick={() => logs.setPage(logs.page + 1)}
            >
              Sau
            </Button>
          </div>
        )}
      </Section>
    </AppShell>
  );
}
