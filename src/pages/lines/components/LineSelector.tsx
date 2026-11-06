import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LineResponse } from "@/lib/api";
import { lineColor } from "@/pages/stations/hooks/useNetwork";

export function LineSelector({
  lines,
  value,
  onValueChange,
  onCreate,
}: {
  lines: LineResponse[];
  value?: number;
  onValueChange: (lineId: number) => void;
  /** Bỏ trống khi người dùng không có quyền STATION_MANAGE. */
  onCreate?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {lines.length > 0 && (
        <Tabs
          value={value === undefined ? "" : String(value)}
          onValueChange={(v) => onValueChange(Number(v))}
        >
          <TabsList className="h-auto flex-wrap">
            {lines.map((line) => (
              <TabsTrigger key={line.id} value={String(line.id)} title={line.nameLine}>
                <span
                  className="mr-2 h-2.5 w-2.5 rounded-full"
                  style={{ background: lineColor(line) }}
                />
                {line.code}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      {onCreate && (
        <Button size="sm" variant="outline" onClick={onCreate}>
          <Plus className="h-4 w-4" /> Thêm tuyến
        </Button>
      )}
    </div>
  );
}
