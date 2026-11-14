import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUserNames } from "@/hooks/use-user-names";
import { apiErrorMessage, campaignsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtInstant } from "@/lib/query-sync";
import type { Announcement } from "@/stores/announcements";
import {
  PHASE_LABELS,
  SEVERITY_LABELS,
  type AnnouncementPhase,
} from "@/pages/notifications/notifications.constants";
import { ANNOUNCEMENTS_KEY, scopeLabel } from "@/pages/notifications/notifications.service";

/** Kết quả gửi của chiến dịch backend tự tạo khi thông báo được duyệt. */
function DeliveryBox({ announcementId }: { announcementId: string }) {
  const { hasPermission } = useAuth();
  const canView = hasPermission("NOTIFICATION_MANAGE") || hasPermission("REPORT_VIEW");
  const query = useQuery({
    queryKey: [...ANNOUNCEMENTS_KEY, "delivery", announcementId],
    enabled: canView,
    retry: false,
    queryFn: async () => {
      const page = await campaignsApi.list({ size: 100 });
      const campaign = page.content.find((c) => String(c.announcementId) === announcementId);
      if (!campaign) return null;
      return { campaign, stats: await campaignsApi.stats(campaign.id) };
    },
  });
  if (!canView) return null;
  const sum = (channel: "PUSH" | "EMAIL", status: "SENT" | "FAILED") =>
    query.data?.stats.deliveries[channel]?.[status] ?? 0;
  return (
    <div className="space-y-1 rounded-lg border p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Kết quả gửi
      </h3>
      {query.isPending && <p role="status">Đang tải…</p>}
      {query.error && <p role="alert">Không tải được: {apiErrorMessage(query.error)}</p>}
      {query.data === null && <p>Chưa tạo đợt gửi cho thông báo này.</p>}
      {query.data && (
        <>
          <p>
            <StatusBadge s={query.data.campaign.status} /> · người nhận{" "}
            <b>{query.data.stats.recipients.toLocaleString("vi-VN")}</b> · đã đọc trong ứng dụng{" "}
            <b>{query.data.stats.read.toLocaleString("vi-VN")}</b>
          </p>
          <p>
            Thông báo đẩy: {sum("PUSH", "SENT")} thành công
            {sum("PUSH", "FAILED") ? ` · ${sum("PUSH", "FAILED")} lỗi` : ""} · Email:{" "}
            {sum("EMAIL", "SENT")} thành công
            {sum("EMAIL", "FAILED") ? ` · ${sum("EMAIL", "FAILED")} lỗi` : ""}
          </p>
          {query.data.campaign.error && (
            <p className="text-destructive">{query.data.campaign.error}</p>
          )}
        </>
      )}
    </div>
  );
}

export function DetailSheet({
  item: a,
  canManage,
  canApprove,
  pending,
  onClose,
  onEditDraft,
  onSubmit,
  onApprove,
  onReject,
}: {
  item: (Announcement & { phase: AnnouncementPhase }) | null;
  canManage: boolean;
  canApprove: boolean;
  pending: boolean;
  onClose: () => void;
  onEditDraft: (id: string) => void;
  onSubmit: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: () => void;
}) {
  const nameOf = useUserNames();
  return (
    <Sheet open={!!a} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {a && (
          <>
            <SheetHeader>
              <SheetTitle className="pr-6">{a.title}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <StatusBadge s={PHASE_LABELS[a.phase].badge} label={PHASE_LABELS[a.phase].label} />#
                {a.id} · tạo bởi {nameOf(a.createdBy)}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6 text-sm">
              <p className="whitespace-pre-line rounded-lg bg-muted/60 p-3">{a.content}</p>
              {a.status === "REJECTED" && a.rejectionReason && (
                <p className="rounded-lg bg-destructive/10 p-3 text-destructive">
                  Lý do từ chối: {a.rejectionReason}
                </p>
              )}
              <dl className="grid grid-cols-2 gap-3">
                {[
                  ["Mức độ", SEVERITY_LABELS[a.severity]],
                  ["Phạm vi", scopeLabel(a)],
                  ["Hiệu lực từ", fmtInstant(a.startsAt)],
                  ["Đến", a.endsAt ? fmtInstant(a.endsAt) : "Không thời hạn"],
                  ["Người duyệt", a.approvedBy ? nameOf(a.approvedBy) : "—"],
                  ["Duyệt lúc", fmtInstant(a.approvedAt)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {a.status === "APPROVED" && <DeliveryBox announcementId={a.id} />}
              <div className="flex flex-wrap gap-2">
                {canManage && (a.status === "DRAFT" || a.status === "REJECTED") && (
                  <Button variant="outline" disabled={pending} onClick={() => onEditDraft(a.id)}>
                    Sửa
                  </Button>
                )}
                {canManage && a.status === "DRAFT" && (
                  <Button disabled={pending} onClick={() => onSubmit(a.id)}>
                    Gửi duyệt
                  </Button>
                )}
                {canApprove && a.status === "PENDING_APPROVAL" && (
                  <>
                    <Button variant="outline" disabled={pending} onClick={onReject}>
                      Từ chối
                    </Button>
                    <Button disabled={pending} onClick={() => onApprove(a.id)}>
                      Duyệt
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
