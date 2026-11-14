import { CheckCircle2, Plus, XCircle } from "lucide-react";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONFIG_STATUS_LABELS, availableTrains } from "@/lib/operations";
import type { MetroLine } from "@/stores/metro";
import type { OperationConfig } from "@/stores/operations";
import type { ConfigAction } from "@/pages/trains/hooks/useTrains";
import { assessConfig, describeHours, describePeriod } from "@/pages/trains/trains.service";

const badge: Record<OperationConfig["status"], string> = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export function OperationConfigSection({
  lines,
  lineId,
  lineLabel,
  onLineChange,
  configs,
  canManage,
  canApprove,
  pending,
  onCreate,
  onEdit,
  onAction,
  onReject,
}: {
  lines: MetroLine[];
  lineId: string;
  lineLabel: string;
  onLineChange: (lineId: string) => void;
  configs: OperationConfig[];
  canManage: boolean;
  canApprove: boolean;
  pending: boolean;
  onCreate: () => void;
  onEdit: (c: OperationConfig) => void;
  onAction: (c: OperationConfig, action: ConfigAction) => void;
  onReject: (c: OperationConfig) => void;
}) {
  return (
    <Section
      title="Cấu hình vận hành"
      description="Nháp → Manager duyệt → kích hoạt. Mỗi phiên bản được kiểm tra số đoàn tàu có đủ để giữ giãn cách."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={lineId} onValueChange={onLineChange} disabled={!lines.length}>
            <SelectTrigger className="w-56" aria-label="Tuyến">
              <SelectValue placeholder="Chọn tuyến">{lineLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {lines.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.code} · {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage && (
            <Button onClick={onCreate} disabled={!lineId}>
              <Plus className="h-4 w-4" />
              Tạo phiên bản mới
            </Button>
          )}
        </div>
      }
    >
      <DataTable
        rows={[...configs].sort((a, b) => b.version - a.version)}
        cols={[
          { h: "Phiên bản", c: (c) => <b>v{c.version}</b> },
          { h: "Giờ vận hành", c: (c) => describeHours(c) },
          { h: "Giãn cách", c: (c) => `${c.headwayMinutes} phút` },
          {
            h: "Đoàn tàu",
            c: (c) => {
              const a = assessConfig(c);
              const live = c.status === "DRAFT" || c.status === "PENDING_APPROVAL";
              const ok = !a.capacity.length;
              const reason =
                c.numberOfTrains < a.need.trains
                  ? `Ít hơn mức tối thiểu ${a.need.trains}`
                  : `Tuyến chỉ có ${availableTrains(c.lineId)} đoàn khả dụng`;
              return (
                <div className={live ? (ok ? "text-success" : "text-destructive") : ""}>
                  <span className="whitespace-nowrap font-medium">
                    {live &&
                      (ok ? (
                        <CheckCircle2 className="mr-1 inline h-4 w-4" />
                      ) : (
                        <XCircle className="mr-1 inline h-4 w-4" />
                      ))}
                    {c.numberOfTrains} đoàn
                  </span>
                  <p className="text-xs text-muted-foreground">tối thiểu {a.need.trains}</p>
                  {live && !ok && <p className="text-xs">{reason}</p>}
                </div>
              );
            },
          },
          {
            h: "Chạy / quay đầu",
            c: (c) => `${c.runningTimeMinutes} / ${c.turnaroundTimeMinutes} phút`,
          },
          {
            h: "Hiệu lực",
            c: (c) => <span className="whitespace-nowrap text-xs">{describePeriod(c)}</span>,
          },
          {
            h: "Trạng thái",
            c: (c) => (
              <div>
                <StatusBadge s={badge[c.status]} label={CONFIG_STATUS_LABELS[c.status]} />
                {c.status === "REJECTED" && c.rejectionReason && (
                  <p className="mt-1 max-w-48 text-xs text-destructive">{c.rejectionReason}</p>
                )}
              </div>
            ),
          },
          { h: "Người duyệt", c: (c) => c.approvedBy ?? "—" },
          {
            h: "Thao tác",
            className: "text-right",
            c: (c) => (
              <div className="flex flex-wrap justify-end gap-1.5">
                {canManage && (c.status === "DRAFT" || c.status === "REJECTED") && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => onEdit(c)}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      disabled={pending || assessConfig(c).capacity.length > 0}
                      onClick={() => onAction(c, "submit")}
                    >
                      Gửi duyệt
                    </Button>
                  </>
                )}
                {canApprove && c.status === "PENDING_APPROVAL" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => onReject(c)}
                    >
                      Từ chối
                    </Button>
                    <Button size="sm" disabled={pending} onClick={() => onAction(c, "approve")}>
                      Duyệt
                    </Button>
                  </>
                )}
                {canApprove && (c.status === "APPROVED" || c.status === "INACTIVE") && (
                  <Button size="sm" disabled={pending} onClick={() => onAction(c, "activate")}>
                    Kích hoạt
                  </Button>
                )}
                {canApprove && c.status === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => onAction(c, "deactivate")}
                  >
                    Ngừng áp dụng
                  </Button>
                )}
                {canManage &&
                  c.status !== "DRAFT" &&
                  c.status !== "REJECTED" &&
                  c.status !== "PENDING_APPROVAL" && (
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => onEdit(c)}>
                      Tạo bản sửa
                    </Button>
                  )}
              </div>
            ),
          },
        ]}
      />
    </Section>
  );
}
