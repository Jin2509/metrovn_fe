import { useState } from "react";
import { toast } from "sonner";
import { availableTrains, setTrainStatus, TRAIN_STATUS_LABELS } from "@/lib/operations";
import {
  operationConfigsStore,
  trainsStore,
  type OperationConfig,
  type Train,
  type TrainStatus,
} from "@/mocks/operations";
import {
  assessConfig,
  newDraftFrom,
  saveConfigDraft,
  submitConfig,
} from "@/pages/trains/trains.service";
import type { ConfigDraft } from "@/pages/trains/trains.types";

export function useTrains() {
  const trains = trainsStore.use();
  const configs = operationConfigsStore.use();
  const available = availableTrains("L1", trains);
  const active = configs.find((c) => c.lineId === "L1" && c.status === "ACTIVE");
  const [editor, setEditor] = useState<{ id?: string; draft: ConfigDraft } | null>(null);

  const saveEditor = () => {
    if (!editor) return;
    // Lỗi nhập liệu chặn lưu; thiếu tàu vẫn cho lưu nháp nhưng không gửi duyệt được.
    const { errors } = assessConfig(editor.draft);
    if (errors.length) return toast.error(errors[0]);
    saveConfigDraft(editor.draft, editor.id);
    toast.success("Đã lưu bản nháp");
    setEditor(null);
  };

  const send = (c: OperationConfig) => {
    const { errors, capacity } = assessConfig(c);
    const blocking = [...errors, ...capacity];
    if (blocking.length) return toast.error(blocking[0]);
    submitConfig(c);
    toast.success("Đã gửi Manager duyệt");
  };

  const changeStatus = (t: Train, status: TrainStatus) => {
    setTrainStatus(t, status);
    toast.success(`${t.code}: ${TRAIN_STATUS_LABELS[status]}`);
  };

  return {
    trains,
    configs,
    available,
    active,
    editor,
    setEditor,
    openCreate: () => setEditor({ draft: newDraftFrom(active) }),
    openEdit: (c: OperationConfig) => setEditor({ id: c.id, draft: { ...c } }),
    saveEditor,
    send,
    changeStatus,
  };
}
