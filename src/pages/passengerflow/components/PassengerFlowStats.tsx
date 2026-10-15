import { StatCard } from "@/components/shared";

export function PassengerFlowStats({
  total,
  peakHour,
  peakVolume,
}: {
  total: string;
  peakHour: string;
  peakVolume: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Tổng lượt" value={total} />
      <StatCard label="Giờ cao điểm" value={peakHour} />
      <StatCard label="Lượt giờ cao điểm" value={peakVolume} />
    </div>
  );
}
