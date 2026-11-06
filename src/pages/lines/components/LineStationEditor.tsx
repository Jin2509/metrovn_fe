import { AlertTriangle, ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Section, StatusBadge } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { LinesState } from "@/pages/lines/hooks/useLines";
import { STATION_STATUS_LABELS } from "@/pages/stations/stations.service";

const km = (n: number) =>
  n.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 3 });

const END = "end";

/** Bảng ga trên tuyến: thứ tự (kéo thả), số liệu đoạn từ ga trước và thời gian dừng. */
export function LineStationEditor({ l }: { l: LinesState }) {
  const [addStationId, setAddStationId] = useState("");
  const [addPosition, setAddPosition] = useState(END);
  if (!l.line) return null;
  const canEdit = l.editable;
  // Khi đang đổi thứ tự thì khoá sửa đoạn/thêm/gỡ ga: số liệu đoạn phụ thuộc thứ tự đã lưu.
  const structureLocked = !canEdit || l.orderDirty;
  const segmentLocked = !canEdit || l.orderDirty;
  const chainage = new Map(l.totals.chainage.map((c) => [c.stationId, c.km]));

  const submitAdd = async () => {
    if (!addStationId) return;
    const done = await l.addStation(
      Number(addStationId),
      addPosition === END ? undefined : Number(addPosition),
    );
    if (done) {
      setAddStationId("");
      setAddPosition(END);
    }
  };

  return (
    <Section
      title="Thứ tự ga"
      description={
        l.canManage
          ? "Kéo thả hoặc dùng mũi tên để đổi thứ tự rồi bấm Lưu thứ tự. Sửa số liệu đoạn rồi bấm Lưu số liệu đoạn."
          : "Bạn chỉ có quyền xem."
      }
      action={
        l.canManage && (
          <div className="flex flex-wrap gap-2">
            {l.orderDirty ? (
              <>
                <Button variant="ghost" disabled={l.pending} onClick={l.resetOrder}>
                  Hoàn tác
                </Button>
                <Button disabled={l.pending} onClick={() => void l.saveOrder()}>
                  Lưu thứ tự
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  disabled={!l.segmentsDirty || l.pending}
                  onClick={l.resetSegments}
                >
                  Hoàn tác
                </Button>
                <Button
                  disabled={!l.segmentsDirty || l.pending}
                  onClick={() => void l.saveSegments()}
                >
                  Lưu số liệu đoạn
                </Button>
              </>
            )}
          </div>
        )
      }
    >
      {l.recalculated.length > 0 && (
        <Alert className="mb-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Có <b>{l.recalculated.length}</b> đoạn vừa được hệ thống tính lại tự động (đường chim
            bay, 60 giây/km) — ngắn hơn đường ray thực tế. Hãy kiểm tra các dòng được đánh dấu.
          </AlertDescription>
        </Alert>
      )}
      {l.orderDirty && (
        <Alert className="mb-3">
          <AlertDescription>
            Thứ tự chưa được lưu. Sau khi lưu, các đoạn có ga liền trước thay đổi sẽ được tính lại
            tự động.
          </AlertDescription>
        </Alert>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr className="border-b">
              <th className="w-16 py-2 text-left font-semibold">#</th>
              <th className="py-2 text-left font-semibold">Ga</th>
              <th className="w-28 py-2 text-left font-semibold">Từ ga trước (km)</th>
              <th className="w-28 py-2 text-left font-semibold">Thời gian chạy (giây)</th>
              <th className="w-24 py-2 text-left font-semibold">Dừng (giây)</th>
              <th className="w-20 py-2 text-right font-semibold">Lý trình</th>
              {l.canManage && <th className="w-28" />}
            </tr>
          </thead>
          <tbody>
            {l.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  {l.loading ? "Đang tải…" : "Tuyến chưa có ga nào"}
                </td>
              </tr>
            )}
            {l.rows.map((r, i) => {
              const seg = l.segmentDraft(r);
              const flagged = l.recalculated.includes(r.station.id);
              const ch = chainage.get(r.station.id);
              return (
                <tr
                  key={r.station.id}
                  draggable={canEdit}
                  onDragStart={() => l.setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => l.drop(i)}
                  className={cn("border-b last:border-0", flagged && "bg-amber-500/10")}
                >
                  <td className="py-1.5">
                    <div className="flex items-center gap-1 tabular-nums">
                      {canEdit && (
                        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                      )}
                      {i + 1}
                    </div>
                  </td>
                  <td className="min-w-36 py-1.5 pr-2">
                    <div className="font-medium">{r.station.nameStation}</div>
                    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      {r.station.code}
                      {r.station.status !== "ACTIVE" && (
                        <StatusBadge
                          s={r.station.status}
                          label={STATION_STATUS_LABELS[r.station.status]}
                        />
                      )}
                      {flagged && (
                        <span className="font-medium text-amber-600">
                          · vừa tính lại, cần kiểm tra
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-1.5">
                    {i === 0 ? (
                      <span className="text-xs text-muted-foreground">Ga đầu</span>
                    ) : (
                      <Input
                        type="number"
                        step="0.001"
                        min={0}
                        className="h-8"
                        disabled={segmentLocked}
                        value={seg.distance}
                        onChange={(e) => l.setSegment(r, { distance: e.target.value })}
                      />
                    )}
                  </td>
                  <td className="py-1.5">
                    {i > 0 && (
                      <Input
                        type="number"
                        min={0}
                        className="h-8"
                        disabled={segmentLocked}
                        value={seg.travel}
                        onChange={(e) => l.setSegment(r, { travel: e.target.value })}
                      />
                    )}
                  </td>
                  <td className="py-1.5">
                    <Input
                      type="number"
                      min={0}
                      className="h-8"
                      disabled={segmentLocked}
                      value={seg.dwell}
                      onChange={(e) => l.setSegment(r, { dwell: e.target.value })}
                    />
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                    {ch !== undefined && !l.orderDirty ? km(ch) : "—"}
                  </td>
                  {l.canManage && (
                    <td className="py-1.5 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        aria-label="Lên"
                        disabled={!canEdit || i === 0}
                        onClick={() => l.move(i, i - 1)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        aria-label="Xuống"
                        disabled={!canEdit || i === l.rows.length - 1}
                        onClick={() => l.move(i, i + 1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        aria-label="Gỡ ga khỏi tuyến"
                        disabled={structureLocked}
                        onClick={() => l.setRemoveTarget(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {l.canManage && l.candidates.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <Select value={addStationId} onValueChange={setAddStationId} disabled={structureLocked}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Chọn ga để thêm vào tuyến" />
            </SelectTrigger>
            <SelectContent>
              {l.candidates.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.code} · {s.nameStation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={addPosition} onValueChange={setAddPosition} disabled={structureLocked}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={END}>Cuối tuyến</SelectItem>
              {l.rows.map((r, i) => (
                <SelectItem key={r.station.id} value={String(i + 1)}>
                  Vị trí {i + 1} (trước {r.station.nameStation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={structureLocked || !addStationId}
            onClick={() => void submitAdd()}
          >
            Thêm ga
          </Button>
        </div>
      )}
    </Section>
  );
}
