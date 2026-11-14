import { Section } from "@/components/shared";
import type { GreenSettings } from "@/lib/api";

const num = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });

export function GreenPolicyTable({ settings }: { settings: GreenSettings | undefined }) {
  return (
    <Section title="Hành trình xanh">
      {settings ? (
        <dl className="divide-y text-sm">
          {(
            [
              ["Trạng thái", settings.enabled ? "Đang bật" : "Đang tắt"],
              ["Điểm xanh mỗi km", num(settings.pointsPerKm)],
              [
                "CO₂ tiết kiệm mỗi km",
                `${num(Math.max(0, settings.baselineGramsPerKm - settings.metroGramsPerKm))} g`,
              ],
              [
                "Chuyến được tính",
                `${settings.minTripMinutes}–${settings.maxTripMinutes} phút, tối đa ${settings.maxCountedTripsPerDay} chuyến/ngày`,
              ],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa tải được cài đặt Hành trình xanh.</p>
      )}
    </Section>
  );
}
