import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage, operationConfigsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { availableTrains } from "@/lib/operations";
import { useOperationConfigsData, useTrainsData } from "@/lib/operations.queries";
import { linesStore } from "@/stores/metro";
import { operationConfigsStore, trainsStore, type OperationConfig } from "@/stores/operations";
import { linkToActiveWork } from "@/pages/approvals/work-requests.service";
import { assessConfig, newDraftFrom, saveConfigDraft } from "@/pages/trains/trains.service";
import type { ConfigDraft } from "@/pages/trains/trains.types";

export const OPERATION_MANAGE = "OPERATION_MANAGE";
export const OPERATION_APPROVE = "OPERATION_APPROVE";

export type ConfigAction = "submit" | "approve" | "activate" | "deactivate";

export function useTrains() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(OPERATION_MANAGE);
  const canApprove = hasPermission(OPERATION_APPROVE);
  const trainsData = useTrainsData();
  const configsData = useOperationConfigsData();
  const trains = trainsStore.use();
  const allConfigs = operationConfigsStore.use();
  const lines = linesStore.use();
  const [chosenLine, setLineId] = useState("");
  const lineId = chosenLine || lines[0]?.id || "";
  const line = lines.find((l) => l.id === lineId);
  const configs = allConfigs.filter((c) => c.lineId === lineId);
  const available = availableTrains(lineId, trains);
  const active = configs.find((c) => c.status === "ACTIVE");
  const [editor, setEditor] = useState<{ id?: string; draft: ConfigDraft } | null>(null);
  const [rejecting, setRejecting] = useState<OperationConfig | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (task: () => Promise<unknown>, success: string) => {
    if (pending) return false;
    setPending(true);
    try {
      await task();
      toast.success(success);
      await configsData.reload();
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error));
      return false;
    } finally {
      setPending(false);
    }
  };

  const saveEditor = async () => {
    if (!editor) return;
    // Lỗi nhập liệu chặn lưu; thiếu tàu vẫn cho lưu nháp nhưng không gửi duyệt được.
    const { errors } = assessConfig(editor.draft);
    if (errors.length) return void toast.error(errors[0]);
    if (await run(() => saveConfigDraft(editor.draft, editor.id), "Đã lưu bản nháp"))
      setEditor(null);
  };

  const act = (c: OperationConfig, action: ConfigAction) => {
    if (action === "submit") {
      const { errors, capacity } = assessConfig(c);
      const blocking = [...errors, ...capacity];
      if (blocking.length) return void toast.error(blocking[0]);
    }
    const id = Number(c.id);
    const tasks: Record<ConfigAction, [() => Promise<unknown>, string]> = {
      submit: [
        async () => {
          await operationConfigsApi.submit(id);
          linkToActiveWork(`OPERATION:${id}`, `Cấu hình vận hành v${c.version}`);
        },
        "Đã gửi Manager duyệt",
      ],
      approve: [() => operationConfigsApi.approve(id), `Đã duyệt v${c.version}`],
      activate: [() => operationConfigsApi.activate(id), `Đã áp dụng v${c.version}`],
      deactivate: [() => operationConfigsApi.deactivate(id), `Đã ngừng áp dụng v${c.version}`],
    };
    void run(...tasks[action]);
  };

  const reject = async (reason: string) => {
    if (!rejecting) return;
    const id = Number(rejecting.id);
    if (await run(() => operationConfigsApi.reject(id, reason), `Đã từ chối v${rejecting.version}`))
      setRejecting(null);
  };

  return {
    canManage,
    canApprove,
    loading: trainsData.loading || configsData.loading,
    loadError: trainsData.loadError || configsData.loadError,
    reload: () => Promise.all([trainsData.reload(), configsData.reload()]),
    lines,
    lineId,
    line,
    setLineId,
    trains,
    configs,
    available,
    active,
    editor,
    setEditor,
    pending,
    openCreate: () => setEditor({ draft: newDraftFrom(active, lineId) }),
    openEdit: (c: OperationConfig) => setEditor({ id: c.id, draft: { ...c } }),
    saveEditor,
    act,
    rejecting,
    setRejecting,
    reject,
  };
}
