import { DataTable, Section, StatusBadge } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnnouncementAudience } from "@/mocks/announcements";
import {
  AUDIENCE_LABELS,
  PHASE_LABELS,
  SEVERITY_LABELS,
  type AnnouncementPhase,
} from "@/pages/notifications/notifications.constants";
import { scopeLabel } from "@/pages/notifications/notifications.service";
import { DetailSheet } from "@/pages/notifications/components/DetailSheet";
import { useHistory } from "@/pages/notifications/hooks/useHistory";

export function History({ onEditDraft }: { onEditDraft: () => void }) {
  const h = useHistory(onEditDraft);
  return (
    <Section
      title="Lịch sử thông báo"
      description={`${h.counts.active} đang hiệu lực · ${h.counts.scheduled} sắp hiệu lực · ${h.counts.draft} nháp${h.counts.failed ? ` · ${h.counts.failed} lượt gửi lỗi cần xử lý` : ""}`}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Select value={h.phase} onValueChange={(v) => h.setPhase(v as "ALL" | AnnouncementPhase)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi trạng thái</SelectItem>
            {(Object.keys(PHASE_LABELS) as AnnouncementPhase[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PHASE_LABELS[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={h.audience}
          onValueChange={(v) => h.setAudience(v as "ALL" | AnnouncementAudience)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi nhóm nhận</SelectItem>
            {(Object.keys(AUDIENCE_LABELS) as AnnouncementAudience[]).map((a) => (
              <SelectItem key={a} value={a}>
                {AUDIENCE_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        rows={h.rows}
        onRow={(a) => h.select(a.id)}
        empty="Chưa có thông báo"
        cols={[
          {
            h: "Thông báo",
            className: "min-w-[260px] whitespace-normal",
            c: (a) => (
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {SEVERITY_LABELS[a.severity]} · {scopeLabel(a)}
                </p>
              </div>
            ),
          },
          { h: "Nhóm nhận", c: (a) => AUDIENCE_LABELS[a.audience] },
          {
            h: "Hiệu lực",
            c: (a) => (
              <span className="whitespace-nowrap text-xs">
                {a.startsAt}
                <br />
                {a.endsAt ? `→ ${a.endsAt}` : "→ không thời hạn"}
              </span>
            ),
          },
          {
            h: "Kết quả gửi",
            c: (a) =>
              a.delivery ? (
                <span className={a.delivery.failed ? "text-destructive" : ""}>
                  {a.delivery.sent}/{a.delivery.recipients}
                  {a.delivery.failed ? ` · ${a.delivery.failed} lỗi` : ""}
                </span>
              ) : (
                "—"
              ),
          },
          {
            h: "Đã đọc",
            className: "text-right",
            c: (a) =>
              a.delivery && a.channels.includes("IN_APP")
                ? `${a.delivery.read}/${a.delivery.sent}`
                : "—",
          },
          {
            h: "Trạng thái",
            c: (a) => (
              <StatusBadge s={PHASE_LABELS[a.phase].badge} label={PHASE_LABELS[a.phase].label} />
            ),
          },
        ]}
      />
      <DetailSheet
        item={h.selected}
        onClose={() => h.select(null)}
        onResend={h.resend}
        onEnd={h.end}
        onEditDraft={h.editDraft}
      />
    </Section>
  );
}
