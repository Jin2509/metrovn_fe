import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Section } from "@/components/shared";
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
import type { useLines } from "@/pages/lines/hooks/useLines";

const km = (n: number) =>
  n.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/** Bảng tuyến – ga (line_station): thứ tự ga, khoảng cách và thời gian chạy từ ga trước, thời gian dừng. */
export function LineStationEditor({ l }: { l: ReturnType<typeof useLines> }) {
  const sorted = [...l.rows].sort((a, b) => a.order - b.order);
  return (
    <Section
      title={`${l.line.code}: ${l.line.name}`}
      description="Kéo thả hoặc nhập số thứ tự. Gửi toàn bộ cho Manager duyệt hoặc không gửi gì — thay đổi chỉ áp dụng sau khi được phê duyệt."
      action={
        <div className="flex gap-2">
          <Button variant="ghost" disabled={!l.dirty} onClick={l.reset}>
            Hoàn tác
          </Button>
          <Button disabled={!l.dirty} onClick={l.save}>
            Gửi duyệt
          </Button>
        </div>
      }
    >
      {l.line.status === "ACTIVE" && (
        <Alert className="mb-3">
          <AlertDescription>
            Tuyến đang khai thác: thay đổi khoảng cách ảnh hưởng giá vé lượt và tra cứu lộ trình cho
            vé đặt sau khi được Manager phê duyệt.
          </AlertDescription>
        </Alert>
      )}
      {l.pendingCount > 0 && (
        <Alert className="mb-3">
          <AlertDescription>
            Tuyến này đang có <b>{l.pendingCount}</b> yêu cầu chờ Manager phê duyệt. Thứ tự ga hiện
            tại chưa được áp dụng.
          </AlertDescription>
        </Alert>
      )}
      {l.errors.length > 0 && (
        <ul className="mb-3 list-disc rounded-md bg-destructive/10 p-2 pl-6 text-sm text-destructive">
          {l.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr className="border-b">
              <th className="w-24 py-2 text-left font-semibold">Thứ tự</th>
              <th className="py-2 text-left font-semibold">Ga</th>
              <th className="w-28 py-2 text-left font-semibold">Từ ga trước (km)</th>
              <th className="w-28 py-2 text-left font-semibold">Thời gian chạy (giây)</th>
              <th className="w-24 py-2 text-left font-semibold">Dừng (giây)</th>
              <th className="w-20 py-2 text-right font-semibold">Lý trình</th>
              <th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const ch = l.withChainage.find((c) => c.stationId === r.stationId);
              return (
                <tr
                  key={r.stationId}
                  draggable
                  onDragStart={() => l.setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => l.drop(i)}
                  className="border-b last:border-0"
                >
                  <td className="py-1.5">
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                      <Input
                        type="number"
                        className="h-8 w-14"
                        value={r.order}
                        onChange={(e) => l.update(r.stationId, { order: Number(e.target.value) })}
                      />
                    </div>
                  </td>
                  <td className="min-w-36 py-1.5 pr-2 font-medium">{l.stationName(r.stationId)}</td>
                  <td className="py-1.5">
                    {i === 0 ? (
                      <span className="text-xs text-muted-foreground">Ga đầu</span>
                    ) : (
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8"
                        value={r.distanceFromPrevKm ?? ""}
                        onChange={(e) =>
                          l.update(r.stationId, {
                            distanceFromPrevKm: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    )}
                  </td>
                  <td className="py-1.5">
                    {i > 0 && (
                      <Input
                        type="number"
                        className="h-8"
                        value={r.travelTimeFromPrevSec ?? ""}
                        onChange={(e) =>
                          l.update(r.stationId, {
                            travelTimeFromPrevSec: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    )}
                  </td>
                  <td className="py-1.5">
                    <Input
                      type="number"
                      className="h-8"
                      value={r.dwellSec}
                      onChange={(e) => l.update(r.stationId, { dwellSec: Number(e.target.value) })}
                    />
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                    {ch ? km(ch.km) : "—"}
                  </td>
                  <td className="py-1.5 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label="Lên"
                      onClick={() => l.move(i, i - 1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label="Xuống"
                      onClick={() => l.move(i, i + 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      aria-label="Bỏ ga khỏi tuyến"
                      onClick={() => l.removeStation(r.stationId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {l.candidates.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <Select value="" onValueChange={l.addStation}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Thêm ga vào cuối tuyến" />
            </SelectTrigger>
            <SelectContent>
              {l.candidates.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </Section>
  );
}
