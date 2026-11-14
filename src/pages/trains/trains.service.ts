import { runningTimeMinutes } from "@/lib/network";
import { availableTrains, checkOperationConfig, minTrainsNeeded } from "@/lib/operations";
import { operationConfigsApi } from "@/lib/api";
import { todayIso } from "@/lib/query-sync";
import { getParam } from "@/stores/system-params";
import type { OperationConfig } from "@/stores/operations";
import type { ConfigDraft } from "@/pages/trains/trains.types";

const dmy = (d: string) => d.split("-").reverse().join("/");

export const describeHours = (c: Pick<OperationConfig, "startTime" | "endTime">) =>
  `${c.startTime} – ${c.endTime}`;
export const describePeriod = (c: Pick<OperationConfig, "effectiveFrom" | "effectiveTo">) =>
  `${dmy(c.effectiveFrom)} → ${c.effectiveTo ? dmy(c.effectiveTo) : "không thời hạn"}`;

export function newDraftFrom(base: OperationConfig | undefined, lineId: string): ConfigDraft {
  return {
    lineId,
    numberOfTrains: base?.numberOfTrains ?? 10,
    headwayMinutes: base?.headwayMinutes ?? 6,
    runningTimeMinutes: runningTimeMinutes(lineId),
    turnaroundTimeMinutes: base?.turnaroundTimeMinutes ?? getParam("ops.defaultTurnaroundMinutes"),
    startTime: base?.startTime ?? "05:00",
    endTime: base?.endTime ?? "22:00",
    effectiveFrom: todayIso(),
    effectiveTo: undefined,
  };
}

export function assessConfig(c: ConfigDraft) {
  return { ...checkOperationConfig(c, availableTrains(c.lineId)), need: minTrainsNeeded(c) };
}

const cleanDraft = (c: ConfigDraft) => ({
  numberOfTrains: Number(c.numberOfTrains),
  headwayMinutes: Number(c.headwayMinutes),
  runningTimeMinutes: Number(c.runningTimeMinutes),
  turnaroundTimeMinutes: Number(c.turnaroundTimeMinutes),
  startTime: c.startTime,
  endTime: c.endTime,
  effectiveFrom: c.effectiveFrom,
});

/** Lưu bản nháp. Sửa bản đã duyệt/đang áp dụng thì backend tự sinh bản nháp mới (version + 1). */
export function saveConfigDraft(draft: ConfigDraft, editingId?: string) {
  if (editingId)
    return operationConfigsApi.update(Number(editingId), {
      ...cleanDraft(draft),
      ...(draft.effectiveTo ? { effectiveTo: draft.effectiveTo } : { clearEffectiveTo: true }),
    });
  return operationConfigsApi.create(Number(draft.lineId), {
    ...cleanDraft(draft),
    effectiveTo: draft.effectiveTo || undefined,
  });
}
