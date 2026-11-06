import { Pencil, Trash2 } from "lucide-react";
import { LazyMap } from "@/components/lazy-map";
import { Section, StatusBadge } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LineFormDialog } from "@/pages/lines/components/LineFormDialog";
import { LineSelector } from "@/pages/lines/components/LineSelector";
import { LineStationEditor } from "@/pages/lines/components/LineStationEditor";
import { LineTransfersSection } from "@/pages/lines/components/LineTransfersSection";
import { useLineTransfers } from "@/pages/lines/hooks/useLineTransfers";
import { useLines } from "@/pages/lines/hooks/useLines";
import { LINE_STATUS_LABELS } from "@/pages/lines/lines.service";
import { ConfirmDialog } from "@/pages/stations/components/ConfirmDialog";
import { useNetwork } from "@/pages/stations/hooks/useNetwork";

const fmtKm = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });

/** Tab "Tuyến & thứ tự ga" trong trang Ga & tuyến. */
export function LinesPanel() {
  const l = useLines();
  const net = useNetwork();
  const t = useLineTransfers(l.line, l.lines, net.lineStations);
  const line = l.line;

  return (
    <>
      {l.loadError && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            {l.loadError}
            <Button size="sm" variant="outline" onClick={() => void l.reload()}>
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <LineSelector
        lines={l.lines}
        value={l.lineId}
        onValueChange={l.selectLine}
        onCreate={l.canManage ? l.openCreateLine : undefined}
      />
      {!line && !l.loading && !l.loadError && (
        <p className="text-sm text-muted-foreground">Chưa có tuyến nào.</p>
      )}
      {line && (
        <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
          <LineStationEditor l={l} />
          <div className="min-w-0 space-y-6">
            <Section
              title={`${line.code}: ${line.nameLine}`}
              description={line.description ?? undefined}
              action={<StatusBadge s={line.status} label={LINE_STATUS_LABELS[line.status]} />}
            >
              {l.canManage && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => l.openEditLine(line)}>
                    <Pencil className="h-4 w-4" /> Sửa tuyến
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => l.setDeleteLineOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Xoá tuyến
                  </Button>
                </div>
              )}
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Số ga</dt>
                  <dd className="text-lg font-semibold">{l.totals.chainage.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Chiều dài</dt>
                  <dd className="text-lg font-semibold">{fmtKm(l.totals.km)} km</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Chạy một chiều</dt>
                  <dd className="text-lg font-semibold">{Math.round(l.totals.sec / 60)} phút</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                Thời gian chạy một chiều = Σ thời gian chạy giữa các ga + Σ thời gian dừng ở ga
                giữa.
              </p>
            </Section>
            <LineTransfersSection
              t={t}
              line={line}
              lines={l.lines}
              stations={net.stations}
              canManage={l.canManage}
            />
          </div>
        </div>
      )}
      {line && (
        <Section title="Bản đồ tuyến">
          <LazyMap
            height={480}
            network={l.mapNetwork}
            visibleLines={[String(line.id)]}
            showBus={false}
          />
        </Section>
      )}
      <LineFormDialog
        form={l.lineForm}
        errors={l.lineErrors}
        pending={l.pending}
        onChange={(draft) => l.setLineForm((f) => (f ? { ...f, draft } : f))}
        onClose={() => l.setLineForm(null)}
        onSubmit={() => void l.submitLine()}
      />
      <ConfirmDialog
        open={l.deleteLineOpen}
        title={`Xoá tuyến ${line?.code ?? ""}?`}
        description={
          <>
            <p>
              Thao tác này xoá luôn <b>danh sách ga của tuyến</b>, các <b>điểm chuyển tuyến</b> và{" "}
              <b>cấu hình vận hành</b> của tuyến. Bản ghi ga vẫn được giữ lại.
            </p>
            <p>Không thể hoàn tác.</p>
          </>
        }
        confirmLabel="Xoá tuyến"
        pending={l.pending}
        onClose={() => l.setDeleteLineOpen(false)}
        onConfirm={() => void l.confirmDeleteLine()}
      />
      <ConfirmDialog
        open={!!l.removeTarget}
        title={`Gỡ ga ${l.removeTarget?.station.nameStation ?? ""} khỏi tuyến?`}
        description={
          <p>
            Các ga phía sau sẽ tự dồn lên và đoạn nối được tính lại tự động. Bản ghi ga vẫn được giữ
            lại.
          </p>
        }
        confirmLabel="Gỡ ga"
        pending={l.pending}
        onClose={() => l.setRemoveTarget(null)}
        onConfirm={() => void l.confirmRemove()}
      />
    </>
  );
}
