import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  apiErrorMessage,
  lineTransfersApi,
  linesApi,
  type LineResponse,
  type LineStationResponse,
  type LineTransferResponse,
} from "@/lib/api";
import { NETWORK_KEY, networkKeys } from "@/pages/stations/hooks/useNetwork";

export type TransferDraft = {
  stationId: string;
  toLineId: string;
  minutes: string;
  /** Tạo thêm bản ghi chiều ngược lại (chuyển tuyến có hướng). */
  bothWays: boolean;
};

const EMPTY: TransferDraft = { stationId: "", toLineId: "", minutes: "5", bothWays: true };

/** Điểm chuyển tuyến của một tuyến (Flow F). */
export function useLineTransfers(
  line: LineResponse | undefined,
  lines: LineResponse[],
  lineStations: Record<number, LineStationResponse[]>,
) {
  const queryClient = useQueryClient();
  const lineId = line?.id;
  const query = useQuery({
    queryKey: networkKeys.lineTransfers(lineId ?? -1),
    queryFn: () => linesApi.transfers(lineId!),
    enabled: lineId !== undefined,
    retry: false,
  });
  const [draft, setDraft] = useState<TransferDraft | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LineTransferResponse | null>(null);

  const ownStations = lineId !== undefined ? (lineStations[lineId] ?? []) : [];
  /** Các tuyến khác cũng đi qua ga: chỉ tạo được chuyển tuyến khi ga nằm trên cả hai tuyến. */
  const otherLinesAt = (stationId: number) =>
    lines.filter(
      (l) => l.id !== lineId && (lineStations[l.id] ?? []).some((r) => r.station.id === stationId),
    );
  const candidateStations = ownStations
    .map((r) => r.station)
    .filter((s) => otherLinesAt(s.id).length > 0);

  const refresh = () =>
    // isInterchange của ga đổi theo, nên tải lại cả nhóm dữ liệu mạng lưới.
    queryClient.invalidateQueries({ queryKey: NETWORK_KEY });

  const run = async (action: () => Promise<void>) => {
    if (pending) return;
    setPending(true);
    try {
      await action();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPending(false);
      void refresh();
    }
  };

  const submit = () =>
    run(async () => {
      if (!draft || lineId === undefined) return;
      const stationId = Number(draft.stationId);
      const toLineId = Number(draft.toLineId);
      const minutes = Number(draft.minutes);
      if (!stationId || !toLineId) {
        toast.error("Vui lòng chọn ga và tuyến chuyển sang");
        return;
      }
      if (!(minutes >= 0) || !Number.isInteger(minutes)) {
        toast.error("Thời gian chuyển tuyến phải là số phút nguyên ≥ 0");
        return;
      }
      await lineTransfersApi.create({
        stationId,
        fromLineId: lineId,
        toLineId,
        transferTimeMinutes: minutes,
      });
      if (draft.bothWays)
        await lineTransfersApi.create({
          stationId,
          fromLineId: toLineId,
          toLineId: lineId,
          transferTimeMinutes: minutes,
        });
      toast.success("Đã tạo điểm chuyển tuyến");
      setDraft(null);
    });

  const toggleStatus = (t: LineTransferResponse) =>
    run(async () => {
      await lineTransfersApi.update(t.id, {
        status: t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      toast.success("Đã cập nhật trạng thái chuyển tuyến");
    });

  const confirmDelete = () =>
    run(async () => {
      if (!deleteTarget) return;
      await lineTransfersApi.remove(deleteTarget.id);
      toast.success("Đã xoá điểm chuyển tuyến");
      setDeleteTarget(null);
    });

  return {
    transfers: query.data ?? [],
    loading: query.isPending && lineId !== undefined,
    loadError: query.isError ? apiErrorMessage(query.error) : "",
    pending,
    candidateStations,
    otherLinesAt,
    draft,
    openCreate: () => setDraft(EMPTY),
    setDraft,
    submit,
    toggleStatus,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
  };
}
