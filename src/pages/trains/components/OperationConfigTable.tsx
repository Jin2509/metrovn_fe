import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { OperationConfig } from "@/pages/trains/trains.types";

export function OperationConfigTable({
  configs,
  onSend,
}: {
  configs: OperationConfig[];
  onSend: (configId: string) => void;
}) {
  return (
    <Section title="Cấu hình vận hành (DRAFT → chờ duyệt → hiệu lực)">
      <DataTable
        rows={configs}
        cols={[
          { h: "Phiên bản", c: (config) => <b>{config.version}</b> },
          { h: "Giãn cách", c: (config) => config.headway },
          { h: "Giờ vận hành", c: (config) => config.hours },
          { h: "Trạng thái", c: (config) => <StatusBadge s={config.status} /> },
          { h: "Người duyệt", c: (config) => config.approvedBy || "—" },
          {
            h: "",
            c: (config) =>
              config.status === "DRAFT" && (
                <Button size="sm" onClick={() => onSend(config.id)}>
                  Gửi duyệt
                </Button>
              ),
          },
        ]}
      />
    </Section>
  );
}
