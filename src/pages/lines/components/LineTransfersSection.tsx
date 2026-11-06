import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LineResponse, StationResponse } from "@/lib/api";
import type { useLineTransfers } from "@/pages/lines/hooks/useLineTransfers";
import { ConfirmDialog } from "@/pages/stations/components/ConfirmDialog";

export function LineTransfersSection({
  t,
  line,
  lines,
  stations,
  canManage,
}: {
  t: ReturnType<typeof useLineTransfers>;
  line: LineResponse;
  lines: LineResponse[];
  stations: StationResponse[];
  canManage: boolean;
}) {
  const lineCode = (id: number) => lines.find((l) => l.id === id)?.code ?? `#${id}`;
  const stationName = (id: number) => stations.find((s) => s.id === id)?.nameStation ?? `#${id}`;
  const d = t.draft;
  const toLines = d?.stationId ? t.otherLinesAt(Number(d.stationId)) : [];

  return (
    <Section
      title="Chuyển tuyến"
      description="Chuyển tuyến có hướng: muốn đi được cả hai chiều cần hai bản ghi."
      action={
        canManage &&
        !d && (
          <Button
            size="sm"
            variant="outline"
            disabled={!t.candidateStations.length}
            title={
              t.candidateStations.length
                ? undefined
                : "Cần có ga nằm trên cả tuyến này và một tuyến khác"
            }
            onClick={t.openCreate}
          >
            <Plus className="h-4 w-4" /> Thêm
          </Button>
        )
      }
    >
      {d && (
        <div className="mb-4 grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Ga giao cắt</Label>
            <Select
              value={d.stationId}
              onValueChange={(v) => t.setDraft({ ...d, stationId: v, toLineId: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn ga" />
              </SelectTrigger>
              <SelectContent>
                {t.candidateStations.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nameStation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Từ {line.code} sang tuyến</Label>
            <Select
              value={d.toLineId}
              disabled={!toLines.length}
              onValueChange={(v) => t.setDraft({ ...d, toLineId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn tuyến" />
              </SelectTrigger>
              <SelectContent>
                {toLines.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.code} · {l.nameLine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transfer-min">Thời gian chuyển (phút)</Label>
            <Input
              id="transfer-min"
              type="number"
              min={0}
              value={d.minutes}
              onChange={(e) => t.setDraft({ ...d, minutes: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <Checkbox
              checked={d.bothWays}
              onCheckedChange={(v) => t.setDraft({ ...d, bothWays: !!v })}
            />
            Tạo cả chiều ngược lại
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" disabled={t.pending} onClick={() => t.setDraft(null)}>
              Huỷ
            </Button>
            <Button disabled={t.pending} onClick={() => void t.submit()}>
              {t.pending ? "Đang lưu…" : "Tạo chuyển tuyến"}
            </Button>
          </div>
        </div>
      )}
      {t.loadError && <p className="text-sm text-destructive">{t.loadError}</p>}
      {!t.loading && !t.loadError && !t.transfers.length && (
        <p className="text-sm text-muted-foreground">Tuyến chưa có điểm chuyển tuyến.</p>
      )}
      <div className="space-y-2">
        {t.transfers.map((x) => (
          <div
            key={x.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
          >
            <div>
              <p className="font-medium">Ga {stationName(x.stationId)}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {lineCode(x.fromLineId)} <ArrowRight className="h-3 w-3" /> {lineCode(x.toLineId)} ·{" "}
                {x.transferTimeMinutes} phút
              </p>
            </div>
            <div className="flex items-center gap-1">
              {canManage ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={t.pending}
                  onClick={() => void t.toggleStatus(x)}
                  title="Bật/tắt"
                >
                  <StatusBadge s={x.status} label={x.status === "ACTIVE" ? "Hoạt động" : "Tắt"} />
                </Button>
              ) : (
                <StatusBadge s={x.status} label={x.status === "ACTIVE" ? "Hoạt động" : "Tắt"} />
              )}
              {canManage && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  aria-label="Xoá chuyển tuyến"
                  disabled={t.pending}
                  onClick={() => t.setDeleteTarget(x)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!t.deleteTarget}
        title="Xoá điểm chuyển tuyến?"
        description={
          t.deleteTarget && (
            <p>
              Ga {stationName(t.deleteTarget.stationId)}: {lineCode(t.deleteTarget.fromLineId)} →{" "}
              {lineCode(t.deleteTarget.toLineId)}. Chiều ngược lại (nếu có) không bị xoá.
            </p>
          )
        }
        pending={t.pending}
        onClose={() => t.setDeleteTarget(null)}
        onConfirm={() => void t.confirmDelete()}
      />
    </Section>
  );
}
