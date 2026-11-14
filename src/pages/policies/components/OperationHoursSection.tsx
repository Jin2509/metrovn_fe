import { DataTable, Section } from "@/components/shared";
import { useUserNames } from "@/hooks/use-user-names";
import type { MetroLine } from "@/stores/metro";
import type { OperationConfig } from "@/pages/policies/policies.types";

const dmy = (d: string) => d.split("-").reverse().join("/");

export function OperationHoursSection({
  rows,
}: {
  rows: { line: MetroLine; config: OperationConfig | undefined }[];
}) {
  const nameOf = useUserNames();
  return (
    <Section title="Cấu hình vận hành đang áp dụng">
      <DataTable
        rows={rows}
        rowKey={(r) => r.line.id}
        empty="Chưa có tuyến"
        cols={[
          { h: "Tuyến", c: (r) => <b>{r.line.code}</b> },
          {
            h: "Cấu hình",
            className: "whitespace-normal",
            c: ({ config: c }) =>
              c ? (
                <>
                  v{c.version}: chạy {c.startTime} – {c.endTime} · giãn cách {c.headwayMinutes} phút
                  · {c.numberOfTrains} đoàn tàu · từ {dmy(c.effectiveFrom)}
                </>
              ) : (
                <span className="text-muted-foreground">Chưa có cấu hình hiệu lực</span>
              ),
          },
          { h: "Người duyệt", c: ({ config: c }) => (c?.approvedBy ? nameOf(c.approvedBy) : "—") },
        ]}
      />
    </Section>
  );
}
