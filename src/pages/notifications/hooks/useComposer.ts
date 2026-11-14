import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import type { AnnouncementScope } from "@/stores/announcements";
import {
  ANNOUNCEMENTS_KEY,
  draftPrefillStore,
  emptyDraft,
  saveDraft,
  submitDraft,
  validateDraft,
} from "@/pages/notifications/notifications.service";
import type { AnnouncementDraft } from "@/pages/notifications/notifications.types";

export function useComposer(onDone: () => void) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<AnnouncementDraft>(() => emptyDraft());
  const [editingId, setEditingId] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  // Mở từ Bản đồ / Ga / lịch sử (sửa bản nháp): lấy dữ liệu đã chuẩn bị rồi xóa để không lặp lại.
  const prefill = draftPrefillStore.use();
  useEffect(() => {
    if (!prefill) return;
    setDraft({ ...emptyDraft(), ...prefill.draft });
    setEditingId(prefill.editingId);
    setSubmitted(false);
    draftPrefillStore.set(() => null);
  }, [prefill]);

  const errors = validateDraft(draft);

  const update = (patch: Partial<AnnouncementDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setScope = (scope: AnnouncementScope) =>
    setDraft((d) => ({
      ...d,
      scope,
      lineId: scope === "LINE" || scope === "STATION" ? d.lineId : undefined,
      stationId: scope === "STATION" ? d.stationId : undefined,
      targetRole: scope === "ROLE" ? d.targetRole : undefined,
    }));

  const reset = () => {
    setDraft(emptyDraft());
    setEditingId(undefined);
    setSubmitted(false);
  };

  /** `submit`: lưu rồi gửi Manager duyệt; ngược lại chỉ lưu nháp. Trả về false nếu còn lỗi. */
  const run = async (submit: boolean) => {
    setSubmitted(true);
    if (sending || Object.keys(errors).length) return false;
    setSending(true);
    try {
      if (submit) await submitDraft(draft, editingId);
      else await saveDraft(draft, editingId);
      toast.success(submit ? "Đã gửi Manager duyệt" : "Đã lưu nháp");
      await queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_KEY });
      reset();
      onDone();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSending(false);
    }
    return true;
  };

  return {
    draft,
    editingId,
    update,
    setScope,
    errors,
    showErrors: submitted,
    submit: () => run(true),
    save: () => run(false),
    sending,
    reset,
  };
}
