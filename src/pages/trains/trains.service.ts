import { getActorName } from "@/lib/auth/session.store";
import { runningTimeMinutes } from "@/lib/network";
import { availableTrains, checkOperationConfig, minTrainsNeeded } from "@/lib/operations";
import { logAction, submitApproval } from "@/mocks/admin";
import { operationConfigsStore, type OperationConfig } from "@/mocks/operations";
import type { ConfigDraft } from "@/pages/trains/trains.types";

const pad = (n: number) => String(n).padStart(2, "0");
/** Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD (toISOString dùng UTC nên lệch ngày trước 7 giờ sáng). */
const today = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dmy = (d: string) => d.split("-").reverse().join("/");

export const describeHours = (c: Pick<OperationConfig, "startTime" | "endTime">) =>
  `${c.startTime} – ${c.endTime}`;
export const describePeriod = (c: Pick<OperationConfig, "effectiveFrom" | "effectiveTo">) =>
  `${dmy(c.effectiveFrom)} → ${c.effectiveTo ? dmy(c.effectiveTo) : "không thời hạn"}`;

export function newDraftFrom(base: OperationConfig | undefined, lineId = "L1"): ConfigDraft {
  return {
    lineId,
    numberOfTrains: base?.numberOfTrains ?? 10,
    headwayMinutes: base?.headwayMinutes ?? 6,
    runningTimeMinutes: runningTimeMinutes(lineId),
    turnaroundTimeMinutes: base?.turnaroundTimeMinutes ?? 4,
    startTime: base?.startTime ?? "05:00",
    endTime: base?.endTime ?? "22:00",
    effectiveFrom: today(),
    effectiveTo: undefined,
  };
}

export function assessConfig(c: ConfigDraft) {
  return { ...checkOperationConfig(c, availableTrains(c.lineId)), need: minTrainsNeeded(c) };
}

export function saveConfigDraft(draft: ConfigDraft, editingId?: string) {
  if (editingId) {
    operationConfigsStore.set((list) =>
      list.map((c) => (c.id === editingId ? { ...c, ...draft } : c)),
    );
    logAction("Sửa bản nháp cấu hình vận hành", editingId);
    return;
  }
  const version =
    Math.max(
      0,
      ...operationConfigsStore
        .get()
        .filter((c) => c.lineId === draft.lineId)
        .map((c) => c.version),
    ) + 1;
  operationConfigsStore.set((list) => [
    ...list,
    { ...draft, id: `C${Date.now()}`, version, status: "DRAFT", createdBy: getActorName() },
  ]);
  logAction("Tạo cấu hình vận hành", `v${version}`);
}

export function submitConfig(config: OperationConfig) {
  const current = operationConfigsStore
    .get()
    .find((c) => c.lineId === config.lineId && c.status === "ACTIVE");
  operationConfigsStore.set((list) =>
    list.map((c) => (c.id === config.id ? { ...c, status: "PENDING_APPROVAL" } : c)),
  );
  const row = (field: string, f: (c: OperationConfig) => string) => ({
    field,
    old: current ? f(current) : "—",
    new: f(config),
  });
  submitApproval("OPERATION", `Cấu hình vận hành v${config.version}`, [
    row("Giờ vận hành", describeHours),
    row("Giãn cách", (c) => `${c.headwayMinutes} phút`),
    row("Số đoàn tàu", (c) => String(c.numberOfTrains)),
    row(
      "Thời gian chạy / quay đầu",
      (c) => `${c.runningTimeMinutes} / ${c.turnaroundTimeMinutes} phút`,
    ),
    row("Hiệu lực", describePeriod),
  ]);
}

/**
 * Manager quyết định: duyệt thì cấu hình đến ngày hiệu lực chuyển ACTIVE (cấu hình cũ INACTIVE,
 * effective_to = ngày trước), chưa đến ngày thì APPROVED; từ chối thì trả về DRAFT để sửa.
 */
export function applyOperationDecision(approved: boolean, approver: string) {
  operationConfigsStore.set((list) => {
    const pending = list.find((c) => c.status === "PENDING_APPROVAL");
    if (!pending) return list;
    if (!approved) return list.map((c) => (c.id === pending.id ? { ...c, status: "DRAFT" } : c));
    const startsNow = pending.effectiveFrom <= today();
    return list.map((c) => {
      if (c.id === pending.id)
        return { ...c, status: startsNow ? "ACTIVE" : "APPROVED", approvedBy: approver };
      if (startsNow && c.lineId === pending.lineId && c.status === "ACTIVE")
        return { ...c, status: "INACTIVE", effectiveTo: pending.effectiveFrom };
      return c;
    });
  });
}
