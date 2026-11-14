import { DataTable, LoadState, ReasonDialog, Section, StatusBadge } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtInstant } from "@/lib/query-sync";
import type { AnnouncementScope } from "@/stores/announcements";
import {
  PHASE_LABELS,
  SCOPE_LABELS,
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
      description={`${h.counts.active} đang hiệu lực · ${h.counts.scheduled} sắp hiệu lực · ${h.counts.pending} chờ duyệt · ${h.counts.draft} nháp`}
    >
      <LoadState loading={h.loading} error={h.loadError} onRetry={h.reload} />
      <div className="mb-3 flex flex-wrap gap-2">
        <Select value={h.phase} onValueChange={(v) => h.setPhase(v as "ALL" | AnnouncementPhase)}>
          <SelectTrigger className="w-44" aria-label="Lọc theo trạng thái">
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
        <Select value={h.scope} onValueChange={(v) => h.setScope(v as "ALL" | AnnouncementScope)}>
          <SelectTrigger className="w-44" aria-label="Lọc theo phạm vi">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi phạm vi</SelectItem>
            {(Object.keys(SCOPE_LABELS) as AnnouncementScope[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SCOPE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        rows={h.rows}
        rowKey={(a) => a.id}
        rowActionLabel={(a) => `Xem thông báo ${a.title}`}
        onRow={(a) => h.select(a.id)}
        empty="Chưa có thông báo"
        cols={[
          {
            h: "Thông báo",
            className: "min-w-[260px] whitespace-normal",
            c: (a) => (
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{SEVERITY_LABELS[a.severity]}</p>
              </div>
            ),
          },
          { h: "Phạm vi", c: (a) => scopeLabel(a) },
          {
            h: "Hiệu lực",
            c: (a) => (
              <span className="whitespace-nowrap text-xs">
                {fmtInstant(a.startsAt)}
                <br />
                {a.endsAt ? `→ ${fmtInstant(a.endsAt)}` : "→ không thời hạn"}
              </span>
            ),
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
        canManage={h.canManage}
        canApprove={h.canApprove}
        pending={h.pending}
        onClose={() => h.select(null)}
        onEditDraft={h.editDraft}
        onSubmit={(id) => void h.submit(id)}
        onApprove={(id) => void h.approve(id)}
        onReject={() => h.setRejecting(true)}
      />
      <ReasonDialog
        open={h.rejecting}
        title={h.selected ? `Từ chối thông báo: ${h.selected.title}` : ""}
        confirmLabel="Từ chối"
        onClose={() => h.setRejecting(false)}
        onConfirm={(reason) => void h.reject(reason)}
      />
    </Section>
  );
}
