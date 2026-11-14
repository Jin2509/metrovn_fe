import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { announcementsApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { announcementsStore, type AnnouncementScope } from "@/stores/announcements";
import type { AnnouncementPhase } from "@/pages/notifications/notifications.constants";
import {
  ANNOUNCEMENTS_KEY,
  draftPrefillStore,
  phaseOf,
  submitAnnouncement,
  toDraft,
  useAnnouncementsData,
} from "@/pages/notifications/notifications.service";

export const ANNOUNCEMENT_MANAGE = "ANNOUNCEMENT_MANAGE";
export const ANNOUNCEMENT_APPROVE = "ANNOUNCEMENT_APPROVE";

export function useHistory(onEditDraft: () => void) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(ANNOUNCEMENT_MANAGE);
  const canApprove = hasPermission(ANNOUNCEMENT_APPROVE);
  const data = useAnnouncementsData();
  const list = announcementsStore.use();
  const [phase, setPhase] = useState<"ALL" | AnnouncementPhase>("ALL");
  const [scope, setScope] = useState<"ALL" | AnnouncementScope>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [pending, setPending] = useState(false);
  // Trạng thái hiệu lực phụ thuộc thời gian: làm mới mỗi phút.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const withPhase = list.map((a) => ({ ...a, phase: phaseOf(a, now) }));
  const rows = withPhase
    .filter((a) => (phase === "ALL" || a.phase === phase) && (scope === "ALL" || a.scope === scope))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const count = (p: AnnouncementPhase) => withPhase.filter((a) => a.phase === p).length;
  const selected = withPhase.find((a) => a.id === selectedId) ?? null;

  const run = async (task: () => Promise<unknown>, success: string) => {
    if (pending) return false;
    setPending(true);
    try {
      await task();
      toast.success(success);
      await queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_KEY });
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error));
      return false;
    } finally {
      setPending(false);
    }
  };

  return {
    ...data,
    canManage,
    canApprove,
    pending,
    rows,
    counts: {
      active: count("ACTIVE"),
      scheduled: count("SCHEDULED"),
      draft: count("DRAFT"),
      pending: count("PENDING"),
    },
    phase,
    setPhase,
    scope,
    setScope,
    selected,
    select: setSelectedId,
    submit: (id: string) =>
      run(
        () => submitAnnouncement(Number(id), list.find((a) => a.id === id)?.title ?? ""),
        "Đã gửi Manager duyệt",
      ),
    approve: (id: string) =>
      run(
        () => announcementsApi.approve(Number(id)),
        "Đã duyệt, hệ thống sẽ gửi thông báo vào thời điểm hiệu lực",
      ),
    rejecting,
    setRejecting,
    reject: async (reason: string) => {
      if (!selected) return;
      if (await run(() => announcementsApi.reject(Number(selected.id), reason), "Đã từ chối"))
        setRejecting(false);
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
