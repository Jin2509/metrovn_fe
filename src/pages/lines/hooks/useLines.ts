import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ApiError,
  apiErrorMessage,
  linesApi,
  type LineResponse,
  type LineStationResponse,
  type UpdateSegmentBody,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  EMPTY_LINE_DRAFT,
  buildCreateLineBody,
  buildUpdateLineBody,
  lineErrorsFromApi,
  lineTotals,
  moveItem,
  recalculatedStationIds,
  toLineDraft,
  toOrderItems,
  validateLineDraft,
  type LineDraft,
  type LineErrors,
} from "@/pages/lines/lines.service";
import { NETWORK_KEY, networkKeys, useNetwork } from "@/pages/stations/hooks/useNetwork";
import { STATION_MANAGE } from "@/pages/stations/hooks/useStations";

/** Ô nhập số liệu đoạn đang sửa (chuỗi để xoá trắng được khi đang gõ). */
export type SegmentDraft = { distance: string; travel: string; dwell: string };

const segmentOf = (row: LineStationResponse): SegmentDraft => ({
  distance: String(row.distanceFromPrevKm),
  travel: String(row.travelTimeFromPrevSeconds),
  dwell: String(row.dwellTimeSeconds),
});

/** Các field đoạn đã đổi so với dữ liệu đã lưu; `null` nếu có ô không hợp lệ. */
function segmentPatch(
  draft: SegmentDraft,
  row: LineStationResponse,
  first: boolean,
): UpdateSegmentBody | null {
  const body: UpdateSegmentBody = {};
  const fields = [
    ["dwell", "dwellTimeSeconds", true],
    ["distance", "distanceFromPrevKm", false],
    ["travel", "travelTimeFromPrevSeconds", true],
  ] as const;
  for (const [key, field, integer] of fields) {
    if (first && key !== "dwell") continue; // ga đầu tuyến luôn là 0
    const raw = draft[key].trim();
    const value = Number(raw);
    if (!raw || !(value >= 0) || (integer && !Number.isInteger(value))) return null;
    if (value !== row[field]) body[field] = value;
  }
  return body;
}

export function useLines() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(STATION_MANAGE);
  const net = useNetwork();
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const line = net.lines.find((l) => l.id === selectedLineId) ?? net.lines[0];
  const lineId = line?.id;
  const saved = (lineId !== undefined && net.lineStations[lineId]) || [];

  // Thứ tự đang kéo thả (chưa lưu). `null` = trùng với thứ tự đã lưu.
  const [orderDraft, setOrderDraft] = useState<number[] | null>(null);
  const [segments, setSegments] = useState<Record<number, SegmentDraft>>({});
  const [recalculated, setRecalculated] = useState<number[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<LineStationResponse | null>(null);
  const [lineForm, setLineForm] = useState<{ id?: number; draft: LineDraft } | null>(null);
  const [lineErrors, setLineErrors] = useState<LineErrors>({});
  const [deleteLineOpen, setDeleteLineOpen] = useState(false);

  const byStation = new Map(saved.map((row) => [row.station.id, row]));
  const rows =
    orderDraft?.map((id) => byStation.get(id)).filter((r): r is LineStationResponse => !!r) ??
    saved;
  const orderDirty = !!orderDraft && orderDraft.some((id, i) => saved[i]?.station.id !== id);
  const totals = lineTotals(saved);

  const segmentDraft = (row: LineStationResponse) => segments[row.station.id] ?? segmentOf(row);
  const dirtySegments = saved.flatMap((row, i) => {
    const draft = segments[row.station.id];
    if (!draft) return [];
    const patch = segmentPatch(draft, row, i === 0);
    return patch === null || Object.keys(patch).length ? [{ row, patch }] : [];
  });

  const resetDrafts = () => {
    setOrderDraft(null);
    setSegments({});
  };

  const selectLine = (id: number) => {
    setSelectedLineId(id);
    resetDrafts();
    setRecalculated([]);
  };

  /** Tải lại danh sách ga của tuyến, đánh dấu các đoạn backend vừa tính lại. */
  const refreshLineStations = async (before: LineStationResponse[]) => {
    if (lineId === undefined) return;
    const after = await linesApi.stations(lineId);
    applyLineStations(before, after);
  };
  const applyLineStations = (before: LineStationResponse[], after: LineStationResponse[]) => {
    if (lineId === undefined) return;
    queryClient.setQueryData(networkKeys.lineStations(lineId), after);
    const changed = recalculatedStationIds(before, after);
    setRecalculated((prev) => [
      ...new Set([...prev.filter((id) => !changed.includes(id)), ...changed]),
    ]);
    // Danh sách tuyến của từng ga và chuyển tuyến có thể đổi theo.
    void queryClient.invalidateQueries({ queryKey: [...NETWORK_KEY, "station-lines"] });
    void queryClient.invalidateQueries({ queryKey: [...NETWORK_KEY, "station-connections"] });
    if (changed.length)
      toast.warning(
        `${changed.length} đoạn vừa được tính lại tự động (ước lượng đường chim bay). Hãy kiểm tra và nhập số liệu đường ray thực tế.`,
      );
  };

  /** Chạy một thao tác ghi: khoá nút, báo lỗi; 409 (người khác vừa sửa) thì tải lại danh sách. */
  const run = async (action: () => Promise<void>) => {
    if (pending) return false;
    setPending(true);
    try {
      await action();
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error));
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        resetDrafts();
        await net.reload();
      }
      return false;
    } finally {
      setPending(false);
    }
  };

  const addStation = (stationId: number, stationOrder?: number) =>
    run(async () => {
      if (lineId === undefined) return;
      const before = saved;
      await linesApi.addStation(lineId, { stationId, stationOrder });
      await refreshLineStations(before);
      toast.success("Đã thêm ga vào tuyến");
    });

  const confirmRemove = () =>
    run(async () => {
      if (lineId === undefined || !removeTarget) return;
      const before = saved;
      await linesApi.removeStation(lineId, removeTarget.station.id);
      setSegments((s) => {
        const next = { ...s };
        delete next[removeTarget.station.id];
        return next;
      });
      await refreshLineStations(before);
      toast.success(`Đã gỡ ga ${removeTarget.station.nameStation} khỏi tuyến`);
      setRemoveTarget(null);
    });

  const saveOrder = () =>
    run(async () => {
      if (lineId === undefined || !orderDraft) return;
      const before = saved;
      const after = await linesApi.reorder(lineId, toOrderItems(orderDraft));
      setOrderDraft(null);
      applyLineStations(before, after);
      toast.success("Đã lưu thứ tự ga");
    });

  const saveSegments = () =>
    run(async () => {
      if (lineId === undefined) return;
      if (dirtySegments.some((d) => d.patch === null)) {
        toast.error("Số liệu đoạn phải là số ≥ 0 (thời gian tính bằng giây, số nguyên)");
        return;
      }
      let latest = saved;
      for (const { row, patch } of dirtySegments) {
        const updated = await linesApi.updateSegment(lineId, row.station.id, patch!);
        latest = latest.map((r) => (r.station.id === updated.station.id ? updated : r));
        queryClient.setQueryData(networkKeys.lineStations(lineId), latest);
        setSegments((s) => {
          const next = { ...s };
          delete next[row.station.id];
          return next;
        });
      }
      const savedIds = dirtySegments.map((d) => d.row.station.id);
      setRecalculated((prev) => prev.filter((id) => !savedIds.includes(id)));
      toast.success(`Đã cập nhật ${savedIds.length} đoạn`);
    });

  // ---- Tuyến ----
  const openCreateLine = () => {
    setLineErrors({});
    setLineForm({ draft: EMPTY_LINE_DRAFT });
  };
  const openEditLine = (target: LineResponse) => {
    setLineErrors({});
    setLineForm({ id: target.id, draft: toLineDraft(target) });
  };
  const submitLine = async () => {
    if (!lineForm || pending) return;
    const errors = validateLineDraft(lineForm.draft, net.lines, lineForm.id);
    setLineErrors(errors);
    if (Object.keys(errors).length) return;
    const current = lineForm.id ? net.lines.find((l) => l.id === lineForm.id) : undefined;
    const body = current ? buildUpdateLineBody(lineForm.draft, current) : null;
    if (body && !Object.keys(body).length) return toast.info("Chưa có thay đổi nào");
    setPending(true);
    try {
      const savedLine = current
        ? await linesApi.update(current.id, body!)
        : await linesApi.create(buildCreateLineBody(lineForm.draft));
      await queryClient.invalidateQueries({ queryKey: networkKeys.lines });
      toast.success(
        current ? `Đã cập nhật tuyến ${savedLine.code}` : `Đã tạo tuyến ${savedLine.code}`,
      );
      setLineForm(null);
      if (!current) selectLine(savedLine.id);
    } catch (error) {
      const fieldErrors = lineErrorsFromApi(error);
      if (fieldErrors) setLineErrors(fieldErrors);
      else toast.error(apiErrorMessage(error));
    } finally {
      setPending(false);
    }
  };
  const confirmDeleteLine = () =>
    run(async () => {
      if (!line) return;
      await linesApi.remove(line.id);
      toast.success(`Đã xoá tuyến ${line.code}`);
      setDeleteLineOpen(false);
      setSelectedLineId(null);
      resetDrafts();
      setRecalculated([]);
      queryClient.removeQueries({ queryKey: networkKeys.lineStations(line.id) });
      await net.reload();
    });

  const editable = canManage && !pending;
  return {
    canManage,
    loading: net.loading,
    loadError: net.loadError,
    reload: net.reload,
    lines: net.lines,
    line,
    lineId,
    selectLine,
    mapNetwork: net.mapNetwork,
    rows,
    totals,
    pending,
    recalculated,
    candidates: net.stations.filter((s) => !byStation.has(s.id)),
    // Thứ tự
    orderDirty,
    move: (from: number, to: number) =>
      setOrderDraft(
        moveItem(
          rows.map((r) => r.station.id),
          from,
          to,
        ),
      ),
    dragIndex,
    setDragIndex,
    drop: (to: number) => {
      if (dragIndex !== null)
        setOrderDraft(
          moveItem(
            rows.map((r) => r.station.id),
            dragIndex,
            to,
          ),
        );
      setDragIndex(null);
    },
    saveOrder,
    resetOrder: () => setOrderDraft(null),
    // Đoạn
    segmentDraft,
    setSegment: (row: LineStationResponse, patch: Partial<SegmentDraft>) =>
      setSegments((s) => ({ ...s, [row.station.id]: { ...segmentDraft(row), ...patch } })),
    segmentsDirty: dirtySegments.length > 0,
    saveSegments,
    resetSegments: () => setSegments({}),
    // Ga trên tuyến
    addStation,
    removeTarget,
    setRemoveTarget,
    confirmRemove,
    // Tuyến
    editable,
    lineForm,
    setLineForm,
    lineErrors,
    openCreateLine,
    openEditLine,
    submitLine,
    deleteLineOpen,
    setDeleteLineOpen,
    confirmDeleteLine,
  };
}

export type LinesState = ReturnType<typeof useLines>;
