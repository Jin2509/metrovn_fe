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
import {
  hasTransfer,
  validateTransferDraft,
  type TransferDraft,
  type TransferErrors,
} from "@/pages/lines/lines.service";
import { NETWORK_KEY, networkKeys } from "@/pages/stations/hooks/useNetwork";

export type { TransferDraft } from "@/pages/lines/lines.service";

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
  const transfers = query.data ?? [];
  const [draft, setDraft] = useState<TransferDraft | null>(null);
  const [errors, setErrors] = useState<TransferErrors>({});
  const [attempted, setAttempted] = useState(false);
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

  const validate = (next: TransferDraft) =>
    lineId === undefined ? {} : validateTransferDraft(next, lineId, transfers);

  const updateDraft = (patch: Partial<TransferDraft>) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    if (attempted) setErrors(validate(next));
  };

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
      setAttempted(true);
      const next = validate(draft);
      setErrors(next);
      if (Object.keys(next).length) return;
      const stationId = Number(draft.stationId);
      const toLineId = Number(draft.toLineId);
      const minutes = Number(draft.minutes);
      await lineTransfersApi.create({
        stationId,
        fromLineId: lineId,
        toLineId,
        transferTimeMinutes: minutes,
      });
      if (draft.bothWays) {
        if (hasTransfer(transfers, stationId, toLineId, lineId))
          toast.info("Chiều ngược lại đã có sẵn, không tạo thêm");
        else
          await lineTransfersApi.create({
            stationId,
            fromLineId: toLineId,
            toLineId: lineId,
            transferTimeMinutes: minutes,
          });
      }
      toast.success("Đã tạo điểm chuyển tuyến");
      setDraft(null);
      setErrors({});
      setAttempted(false);
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
    transfers,
    loading: query.isPending && lineId !== undefined,
    loadError: query.isError ? apiErrorMessage(query.error) : "",
    pending,
    candidateStations,
    otherLinesAt,
    draft,
    errors,
    openCreate: () => {
      setDraft(EMPTY);
      setErrors({});
      setAttempted(false);
    },
    closeDraft: () => {
      setDraft(null);
      setErrors({});
    },
    updateDraft,
    submit,
    toggleStatus,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
  };
}
