import { AppShell } from "@/components/app-shell";
import { LineMapPreview } from "@/pages/lines/components/LineMapPreview";
import { LineSelector } from "@/pages/lines/components/LineSelector";
import { StationOrderEditor } from "@/pages/lines/components/StationOrderEditor";
import { useLines } from "@/pages/lines/hooks/useLines";

export function LinesPage() {
  const {
    lineId,
    lines,
    line,
    order,
    dragIndex,
    error,
    selectLine,
    moveStations,
    setStationOrderNumber,
    startDragging,
    dropAt,
    save,
  } = useLines();

  return (
    <AppShell title="Tuyến & thứ tự ga" roles={["ADMIN"]}>
      <LineSelector lines={lines} value={lineId} onValueChange={selectLine} />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <StationOrderEditor
          line={line}
          order={order}
          dragIndex={dragIndex}
          error={error}
          onSave={save}
          onDragStart={startDragging}
          onDrop={dropAt}
          onOrderNumberChange={setStationOrderNumber}
          onMove={moveStations}
        />
        <LineMapPreview lineId={lineId} />
      </div>
    </AppShell>
  );
}
