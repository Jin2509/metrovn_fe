import { CheckCircle2, Plus, XCircle } from "lucide-react";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { CONFIG_STATUS_LABELS, availableTrains } from "@/lib/operations";
import type { OperationConfig } from "@/mocks/operations";
import { assessConfig, describeHours, describePeriod } from "@/pages/trains/trains.service";

const badge: Record<OperationConfig["status"], string> = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING",
  APPROVED: "APPROVED",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export function OperationConfigSection({
  configs,
  onCreate,
  onEdit,
  onSend,
}: {
  configs: OperationConfig[];
  onCreate: () => void;
  onEdit: (c: OperationConfig) => void;
  onSend: (c: OperationConfig) => void;
}) {
  return (
    <Section
      title="Cấu hình vận hành Tuyến 1"
      description="Nháp → Manager duyệt → áp dụng từ ngày hiệu lực. Mỗi phiên bản được kiểm tra số đoàn tàu có đủ để giữ giãn cách."
      action={
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Tạo phiên bản mới
        </Button>
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
            c: (c) => <StatusBadge s={badge[c.status]} label={CONFIG_STATUS_LABELS[c.status]} />,
          },
          { h: "Người duyệt", c: (c) => c.approvedBy ?? "—" },
          {
            h: "",
            className: "text-right",
            c: (c) =>
              c.status === "DRAFT" && (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => onEdit(c)}>
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    disabled={assessConfig(c).capacity.length > 0}
                    onClick={() => onSend(c)}
                  >
                    Gửi duyệt
                  </Button>
                </div>
              ),
          },
        ]}
      />
    </Section>
  );
}
