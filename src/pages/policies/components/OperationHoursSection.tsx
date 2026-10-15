import { Section } from "@/components/shared";
import type { OperationConfig } from "@/pages/policies/policies.types";

export function OperationHoursSection({ operation }: { operation: OperationConfig | undefined }) {
  return (
    <Section title="Giờ vận hành">
      <p className="text-sm">
        {operation ? (
          <>
            Phiên bản <b>{operation.version}</b>: {operation.hours} · giãn cách {operation.headway}{" "}
            · duyệt bởi {operation.approvedBy}
          </>
        ) : (
          "Chưa có cấu hình hiệu lực"
        )}
      </p>
    </Section>
  );
}
