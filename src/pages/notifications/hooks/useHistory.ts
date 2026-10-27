import { useEffect, useState } from "react";
import { toast } from "sonner";
import { announcementsStore, type AnnouncementAudience } from "@/mocks/announcements";
import type { AnnouncementPhase } from "@/pages/notifications/notifications.constants";
import {
  draftPrefillStore,
  endNow,
  phaseOf,
  resendFailed,
  toDraft,
} from "@/pages/notifications/notifications.service";

export function useHistory(onEditDraft: () => void) {
  const list = announcementsStore.use();
  const [phase, setPhase] = useState<"ALL" | AnnouncementPhase>("ALL");
  const [audience, setAudience] = useState<"ALL" | AnnouncementAudience>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Trạng thái hiệu lực phụ thuộc thời gian: làm mới mỗi phút.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const withPhase = list.map((a) => ({ ...a, phase: phaseOf(a, now) }));
  const rows = withPhase
    .filter(
      (a) =>
        (phase === "ALL" || a.phase === phase) && (audience === "ALL" || a.audience === audience),
    )
    .sort((a, b) => (b.sentAt ?? b.createdAt).localeCompare(a.sentAt ?? a.createdAt));
  const count = (p: AnnouncementPhase) => withPhase.filter((a) => a.phase === p).length;

  return {
    rows,
    counts: {
      active: count("ACTIVE"),
      scheduled: count("SCHEDULED"),
      draft: count("DRAFT"),
      failed: list.reduce((n, a) => n + (a.delivery?.failed ?? 0), 0),
    },
    phase,
    setPhase,
    audience,
    setAudience,
    selected: withPhase.find((a) => a.id === selectedId) ?? null,
    select: setSelectedId,
    resend: (id: string) => {
      resendFailed(id);
      toast.success("Đã gửi lại cho người nhận bị lỗi");
    },
    end: (id: string) => {
      endNow(id);
      toast.success("Đã kết thúc, ứng dụng sẽ thôi hiển thị thông báo này");
    },
    editDraft: (id: string) => {
      const a = list.find((x) => x.id === id);
      if (!a) return;
      draftPrefillStore.set(() => ({ draft: toDraft(a), editingId: a.id }));
      setSelectedId(null);
      onEditDraft();
    },
  };
}
