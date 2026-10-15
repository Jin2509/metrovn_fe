import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MetroLine } from "@/mocks/metro";
import type { StationOrder } from "@/pages/lines/lines.types";

export function StationOrderEditor({
  line,
  order,
  dragIndex,
  error,
  onSave,
  onDragStart,
  onDrop,
  onOrderNumberChange,
  onMove,
}: {
  line: MetroLine;
  order: StationOrder[];
  dragIndex: number | null;
  error: string;
  onSave: () => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  onOrderNumberChange: (stationId: string, orderNumber: number) => void;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <Section
      title={`${line.code}: ${line.name}`}
      action={<Button onClick={onSave}>Lưu thứ tự</Button>}
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Kéo thả hoặc nhập số thứ tự. Lưu toàn bộ hoặc không lưu gì.
      </p>
      {error && (
        <p className="mb-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
      )}
      <ul className="space-y-1.5">
        {order.map((station, index) => (
          <li
            key={station.id}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDrop(index)}
            className="flex items-center gap-2 rounded-lg border bg-card p-2 text-sm"
          >
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
            <Input
              type="number"
              value={station.no}
              className="h-8 w-16"
              onChange={(event) => onOrderNumberChange(station.id, Number(event.target.value))}
            />
            <span className="flex-1">{station.name}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onMove(index, index - 1)}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onMove(index, index + 1)}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
