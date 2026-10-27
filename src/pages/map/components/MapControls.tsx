import { Section } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { MetroLine } from "@/mocks/metro";
import { MAP_COLORS } from "@/pages/map/hooks/useMap";

const LEGEND: [string, string][] = [
  [MAP_COLORS.normal, "Hoạt động bình thường"],
  [MAP_COLORS.info, "Có thông báo"],
  [MAP_COLORS.warning, "Cảnh báo / bảo trì"],
  [MAP_COLORS.critical, "Thông báo khẩn cấp"],
  [MAP_COLORS.inactive, "Chưa khai thác"],
];

export function MapControls({
  lines,
  visibleLines,
  onLineVisibilityChange,
  showBus,
  onShowBusChange,
  showTrains,
  onShowTrainsChange,
}: {
  lines: MetroLine[];
  visibleLines: string[];
  onLineVisibilityChange: (lineId: string, visible: boolean) => void;
  showBus: boolean;
  onShowBusChange: (v: boolean) => void;
  showTrains: boolean;
  onShowTrainsChange: (v: boolean) => void;
}) {
  return (
    <Section title="Hiển thị">
      <ul className="grid grid-cols-2 gap-1.5 text-xs">
        {LEGEND.map(([color, label]) => (
          <li key={label} className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-foreground/30"
              style={{ background: color }}
            />
            {label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 shrink-0 rounded-full border-2 border-white bg-slate-900 ring-1 ring-foreground/30" />
          Tàu (mô phỏng)
        </li>
      </ul>
      <div className="mt-4 space-y-2.5 border-t pt-3">
        {lines.map((line) => (
          <label key={line.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-6 rounded-full" style={{ background: line.colorHex }} />
              {line.code}
              {line.status === "PLANNED" && <Badge variant="outline">Chưa khai thác</Badge>}
            </span>
            <Switch
              checked={visibleLines.includes(line.id)}
              onCheckedChange={(v) => onLineVisibilityChange(line.id, v)}
            />
          </label>
        ))}
        <label className="flex items-center justify-between text-sm">
          <span>Vị trí tàu (mô phỏng)</span>
          <Switch checked={showTrains} onCheckedChange={onShowTrainsChange} />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-bus" />
            Trạm xe buýt kết nối
          </span>
          <Switch checked={showBus} onCheckedChange={onShowBusChange} />
        </label>
      </div>
    </Section>
  );
}
