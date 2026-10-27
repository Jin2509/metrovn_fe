import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Announcement } from "@/mocks/announcements";
import {
  AUDIENCE_LABELS,
  CHANNEL_LABELS,
  PHASE_LABELS,
  SEVERITY_LABELS,
  type AnnouncementPhase,
} from "@/pages/notifications/notifications.constants";
import { scopeLabel } from "@/pages/notifications/notifications.service";

export function DetailSheet({
  item: a,
  onClose,
  onResend,
  onEnd,
  onEditDraft,
}: {
  item: (Announcement & { phase: AnnouncementPhase }) | null;
  onClose: () => void;
  onResend: (id: string) => void;
  onEnd: (id: string) => void;
  onEditDraft: (id: string) => void;
}) {
  return (
    <Sheet open={!!a} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {a && (
          <>
            <SheetHeader>
              <SheetTitle className="pr-6">{a.title}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <StatusBadge s={PHASE_LABELS[a.phase].badge} label={PHASE_LABELS[a.phase].label} />
                {a.id} · tạo bởi {a.createdBy}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6 text-sm">
              <p className="whitespace-pre-line rounded-lg bg-muted/60 p-3">{a.content}</p>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  ["Mức độ", SEVERITY_LABELS[a.severity]],
                  ["Nhóm nhận", AUDIENCE_LABELS[a.audience]],
                  ["Phạm vi", scopeLabel(a)],
                  ["Kênh", a.channels.map((c) => CHANNEL_LABELS[c].label).join(", ")],
                  ["Hiệu lực từ", a.startsAt],
                  ["Đến", a.endsAt ?? "Không thời hạn"],
                  ["Thời điểm gửi", a.sentAt ?? "Chưa gửi"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {a.delivery && (
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Kết quả gửi
                  </p>
                  <p>
                    Người nhận: <b>{a.delivery.recipients}</b> · thành công <b>{a.delivery.sent}</b>{" "}
                    · lỗi{" "}
                    <b className={a.delivery.failed ? "text-destructive" : ""}>
                      {a.delivery.failed}
                    </b>
                  </p>
                  {a.channels.includes("IN_APP") && (
                    <p>
                      Đã đọc trong ứng dụng: <b>{a.delivery.read}</b>/{a.delivery.sent}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Lấy từ bảng notification: mỗi người nhận một dòng với trạng thái gửi và cờ đã
                    đọc.
                  </p>
                  {a.delivery.failed > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => onResend(a.id)}
                    >
                      Gửi lại cho {a.delivery.failed} người nhận lỗi
                    </Button>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {a.phase === "DRAFT" && (
                  <Button onClick={() => onEditDraft(a.id)}>Sửa và gửi</Button>
                )}
                {(a.phase === "ACTIVE" || a.phase === "SCHEDULED") && (
                  <Button variant="outline" onClick={() => onEnd(a.id)}>
                    Kết thúc hiệu lực ngay
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
