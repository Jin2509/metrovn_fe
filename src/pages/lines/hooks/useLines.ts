import { useState } from "react";
import { toast } from "sonner";
import { lineStations, lines } from "@/mocks/metro";
import { LINES_ORDER_ERROR_MESSAGE } from "@/pages/lines/lines.constants";
import { saveStationOrder } from "@/pages/lines/lines.service";
import type { StationOrder } from "@/pages/lines/lines.types";

export function useLines() {
  const [lineId, setLineId] = useState("L1");
  const [order, setOrder] = useState<StationOrder[]>(() =>
    lineStations("L1").map((station, index) => ({
      id: station.id,
      name: station.name,
      no: index + 1,
    })),
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const line = lines.find((currentLine) => currentLine.id === lineId)!;

  const selectLine = (nextLineId: string) => {
    setLineId(nextLineId);
    setOrder(
      lineStations(nextLineId).map((station, index) => ({
        id: station.id,
        name: station.name,
        no: index + 1,
      })),
    );
    setError("");
  };

  const moveStations = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const nextOrder = [...order];
    const [movedStation] = nextOrder.splice(from, 1);
    nextOrder.splice(to, 0, movedStation);
    setOrder(nextOrder.map((station, index) => ({ ...station, no: index + 1 })));
  };

  const setStationOrderNumber = (stationId: string, orderNumber: number) => {
    setOrder(
      order.map((station) =>
        station.id === stationId ? { ...station, no: orderNumber } : station,
      ),
    );
  };

  const dropAt = (index: number) => {
    if (dragIndex !== null) moveStations(dragIndex, index);
    setDragIndex(null);
  };

  const save = () => {
    const sortedOrder = saveStationOrder(order, line.code);
    if (!sortedOrder) return setError(LINES_ORDER_ERROR_MESSAGE);
    setOrder(sortedOrder);
    setError("");
    toast.success("Đã lưu toàn bộ thứ tự ga");
  };

  return {
    lineId,
    lines,
    line,
    order,
    dragIndex,
    error,
    selectLine,
    moveStations,
    setStationOrderNumber,
    startDragging: setDragIndex,
    dropAt,
    save,
  };
}
