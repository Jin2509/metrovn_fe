import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { usersStore } from "@/mocks/admin";
import type { AnnouncementAudience, AnnouncementChannel } from "@/mocks/announcements";
import { CHANNELS_BY_AUDIENCE } from "@/pages/notifications/notifications.constants";
import {
  deliverToBackend,
  draftPrefillStore,
  emptyDraft,
  isScheduledForLater,
  publish,
  recipientCount,
  saveDraft,
  validateDraft,
} from "@/pages/notifications/notifications.service";
import type { AnnouncementDraft } from "@/pages/notifications/notifications.types";

export function useComposer(onDone: () => void) {
  const users = usersStore.use();
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

  const recipients = useMemo(() => recipientCount(draft.audience, users), [draft.audience, users]);
  const errors = validateDraft(draft, recipients);

  const update = (patch: Partial<AnnouncementDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setAudience = (audience: AnnouncementAudience) =>
    setDraft((d) => {
      const allowed = CHANNELS_BY_AUDIENCE[audience];
      const kept = d.channels.filter((c) => allowed.includes(c));
      return { ...d, audience, channels: kept.length ? kept : [allowed[0]] };
    });
  const toggleChannel = (c: AnnouncementChannel, on: boolean) =>
    setDraft((d) => ({
      ...d,
      channels: on ? [...d.channels, c] : d.channels.filter((x) => x !== c),
    }));

  const reset = () => {
    setDraft(emptyDraft());
    setEditingId(undefined);
    setSubmitted(false);
  };

  const send = async () => {
    setSubmitted(true);
    if (sending || Object.keys(errors).length) return;
    if (isScheduledForLater(draft))
      return void toast.error("Backend chưa hỗ trợ hẹn giờ, hãy đặt thời điểm bắt đầu là hiện tại");
    setSending(true);
    try {
      const delivered = await deliverToBackend(draft);
      if (!delivered) return void toast.error("Không có tài khoản nào trong nhóm nhận");
      publish(draft, editingId, undefined, delivered);
      toast.success(`Đã gửi thông báo tới ${delivered} người nhận`);
      reset();
      onDone();
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.status === 403
          ? "Bạn không có quyền gửi thông báo"
          : "Không gửi được thông báo, vui lòng thử lại",
      );
    } finally {
      setSending(false);
    }
  };

  const save = () => {
    if (!draft.title.trim()) {
      setSubmitted(true);
      return toast.error("Vui lòng nhập tiêu đề");
    }
    saveDraft(draft, editingId);
    toast.success("Đã lưu nháp");
    reset();
    onDone();
  };

  return {
    draft,
    editingId,
    update,
    setAudience,
    toggleChannel,
    recipients,
    errors,
    showErrors: submitted,
    send,
    sending,
    save,
    reset,
  };
}
