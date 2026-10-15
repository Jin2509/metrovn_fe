import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { MetroLine } from "@/mocks/metro";

export function MapLayersPanel({
  lines,
  visibleLines,
  onLineVisibilityChange,
  showBus,
  onShowBusChange,
}: {
  lines: MetroLine[];
  visibleLines: string[];
  onLineVisibilityChange: (lineId: string, visible: boolean) => void;
  showBus: boolean;
  onShowBusChange: (visible: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lớp hiển thị</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lines.map((line) => (
          <label key={line.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-3 w-6 rounded-full" style={{ background: line.colorHex }} />
              {line.code} {line.status === "PLANNED" && <Badge variant="outline">Quy hoạch</Badge>}
            </span>
            <Switch
              checked={visibleLines.includes(line.id)}
              onCheckedChange={(checked) => onLineVisibilityChange(line.id, checked)}
            />
          </label>
        ))}
        <label className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-bus" />
            Trạm xe buýt
          </span>
          <Switch checked={showBus} onCheckedChange={onShowBusChange} />
        </label>
      </CardContent>
    </Card>
  );
}
