import { useState } from "react";
import { toast } from "sonner";
import { approvalsStore, ticketTypesStore } from "@/mocks/admin";
import { greenConfigStore, type GreenConfig } from "@/mocks/green";
import {
  diffGreenConfig,
  latestGreenApproval,
  submitGreenConfig,
  validateGreenConfig,
} from "@/pages/green/green.service";

/** Bản nháp dùng chung cho các tab cấu hình; đặt ở cấp trang để đổi tab không mất nội dung đang sửa. */
export function useGreenConfig() {
  const saved = greenConfigStore.use();
  const latest = latestGreenApproval(approvalsStore.use());
  const ticketTypes = ticketTypesStore.use();
  const [draft, setDraft] = useState<GreenConfig>(saved);

  const pending = latest?.status === "PENDING" ? latest : null;
  const rejected = latest?.status === "REJECTED" ? latest : null;
  // Đang chờ duyệt thì khóa form và hiện đúng nội dung đã gửi.
  const config = pending ? (pending.payload as GreenConfig) : draft;
  const changes = pending ? pending.changes : diffGreenConfig(saved, draft);
  const errors = pending ? [] : validateGreenConfig(draft);

  return {
    config,
    saved,
    ticketTypes,
    locked: !!pending,
    rejected,
    changes,
    errors,
    update: (patch: Partial<GreenConfig>) => setDraft((d) => ({ ...d, ...patch })),
    reset: () => setDraft(saved),
    submit: () => {
      const error = submitGreenConfig(draft);
      if (error) return toast.error(error);
      toast.success("Đã gửi Manager duyệt. Cấu hình chỉ có hiệu lực sau khi được phê duyệt.");
    },
  };
}

export type GreenConfigForm = ReturnType<typeof useGreenConfig>;
