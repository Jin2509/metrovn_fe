import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  chainage,
  requestLineOrderChange,
  validateLineOrder,
  type LineApprovalPayload,
} from "@/lib/network";
import { approvalsStore } from "@/mocks/admin";
import {
  lineStationRows,
  lineStationsStore,
  lines,
  stationsStore,
  type LineStation,
} from "@/mocks/metro";
import { moveRow, renumber } from "@/pages/lines/lines.service";

export function useLines() {
  const all = lineStationsStore.use();
  const stations = stationsStore.use();
  const approvals = approvalsStore.use();
  const [lineId, setLineId] = useState("L1");
  const [rows, setRows] = useState<LineStation[]>(() => lineStationRows("L1", all));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const line = lines.find((l) => l.id === lineId)!;
  const saved = lineStationRows(lineId, all);
  const dirty = JSON.stringify(rows) !== JSON.stringify(saved);
  const pendingCount = approvals.filter(
    (a) =>
      a.type === "LINE" &&
      a.status === "PENDING" &&
      (a.payload as LineApprovalPayload)?.lineId === lineId,
  ).length;
  const withChainage = useMemo(() => chainage([...rows].sort((a, b) => a.order - b.order)), [rows]);

  const selectLine = (id: string) => {
    setLineId(id);
    setRows(lineStationRows(id, all));
    setErrors([]);
  };
  const update = (stationId: string, patch: Partial<LineStation>) =>
    setRows((r) => r.map((x) => (x.stationId === stationId ? { ...x, ...patch } : x)));
  const addStation = (stationId: string) =>
    setRows((r) =>
      renumber([
        ...r,
        {
          lineId,
          stationId,
          order: r.length + 1,
          distanceFromPrevKm: null,
          travelTimeFromPrevSec: null,
          dwellSec: 30,
        },
      ]),
    );
  const removeStation = (stationId: string) =>
    setRows((r) => renumber(r.filter((x) => x.stationId !== stationId)));

  const save = () => {
    const errs = validateLineOrder(rows);
    setErrors(errs);
    if (errs.length) return toast.error("Thứ tự ga không hợp lệ. Không có thay đổi nào được gửi.");
    const error = requestLineOrderChange(lineId, rows);
    if (error) return toast.error(error);
    toast.success("Đã gửi yêu cầu tới Manager. Thứ tự ga chỉ thay đổi sau khi được phê duyệt.");
  };

  return {
    lines,
    line,
    lineId,
    selectLine,
    rows,
    withChainage,
    stationName: (id: string) => stations.find((s) => s.id === id)?.name ?? id,
    candidates: stations.filter(
      (s) => !rows.some((r) => r.stationId === s.id) && s.status !== "INACTIVE",
    ),
    update,
    move: (from: number, to: number) => setRows((r) => moveRow(r, from, to)),
    dragIndex,
    setDragIndex,
    drop: (to: number) => {
      if (dragIndex !== null) setRows((r) => moveRow(r, dragIndex, to));
      setDragIndex(null);
    },
    addStation,
    removeStation,
    errors,
    dirty,
    pendingCount,
    reset: () => {
      setRows(saved);
      setErrors([]);
    },
    save,
  };
}
