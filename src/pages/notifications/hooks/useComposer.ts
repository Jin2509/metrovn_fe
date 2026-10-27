import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { usersStore } from "@/mocks/admin";
import type { AnnouncementAudience, AnnouncementChannel } from "@/mocks/announcements";
import { CHANNELS_BY_AUDIENCE } from "@/pages/notifications/notifications.constants";
import {
  draftPrefillStore,
  emptyDraft,
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

  const send = () => {
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    const record = publish(draft, editingId);
    const d = record.delivery!;
    if (d.failed)
      toast.warning(
        `Đã gửi ${d.sent}/${d.recipients}, ${d.failed} người nhận lỗi. Xem chi tiết để gửi lại.`,
      );
    else toast.success("Gửi thông báo thành công");
    reset();
    onDone();
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
    save,
    reset,
  };
}
