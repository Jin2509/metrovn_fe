import { LineMapPreview } from "@/pages/lines/components/LineMapPreview";
import { LineSelector } from "@/pages/lines/components/LineSelector";
import { StationOrderEditor } from "@/pages/lines/components/StationOrderEditor";
import { useLines } from "@/pages/lines/hooks/useLines";

/** Tab "Tuyến & thứ tự ga" trong trang Ga & tuyến. */
export function LinesPanel() {
  const {
    lineId,
    lines,
    line,
    order,
    model3d,
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
    <>
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
        <LineMapPreview line={line} model={model3d} />
      </div>
    </>
  );
}
