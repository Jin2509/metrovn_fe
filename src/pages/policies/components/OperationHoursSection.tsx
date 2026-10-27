import { Section } from "@/components/shared";
import type { OperationConfig } from "@/pages/policies/policies.types";

export function OperationHoursSection({ operation }: { operation: OperationConfig | undefined }) {
  return (
    <Section title="Cấu hình vận hành đang áp dụng">
      <p className="text-sm">
        {operation ? (
          <>
            Phiên bản <b>v{operation.version}</b>: chạy {operation.startTime} – {operation.endTime}{" "}
            · giãn cách {operation.headwayMinutes} phút · {operation.numberOfTrains} đoàn tàu · hiệu
            lực từ {operation.effectiveFrom.split("-").reverse().join("/")} · duyệt bởi{" "}
            {operation.approvedBy ?? "—"}
          </>
        ) : (
          "Chưa có cấu hình hiệu lực"
        )}
      </p>
    </Section>
  );
}
