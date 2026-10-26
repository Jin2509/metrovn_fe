import { Activity, Clock, Users } from "lucide-react";
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
      <StatCard label="Tổng lượt" value={total} icon={Users} />
      <StatCard label="Giờ cao điểm" value={peakHour} icon={Clock} tone="accent" />
      <StatCard label="Lượt giờ cao điểm" value={peakVolume} icon={Activity} tone="success" />
    </div>
  );
}
