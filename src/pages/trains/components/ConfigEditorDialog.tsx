import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runningTimeMinutes } from "@/lib/network";
import { availableTrains } from "@/lib/operations";
import { assessConfig } from "@/pages/trains/trains.service";
import type { ConfigDraft } from "@/pages/trains/trains.types";

type NumKey = "numberOfTrains" | "headwayMinutes" | "runningTimeMinutes" | "turnaroundTimeMinutes";
const NUM_FIELDS: [NumKey, string][] = [
  ["headwayMinutes", "Giãn cách (phút)"],
  ["numberOfTrains", "Số đoàn tàu"],
  ["runningTimeMinutes", "Thời gian chạy một chiều (phút)"],
  ["turnaroundTimeMinutes", "Thời gian quay đầu (phút)"],
];

export function ConfigEditorDialog({
  editor,
  onChange,
  onClose,
  onSave,
}: {
  editor: { id?: string; draft: ConfigDraft } | null;
  onChange: (draft: ConfigDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!editor) return null;
  const d = editor.draft;
  const a = assessConfig(d);
  const fromRoute = runningTimeMinutes(d.lineId);
  const set = (patch: Partial<ConfigDraft>) => onChange({ ...d, ...patch });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editor.id ? "Sửa bản nháp" : "Cấu hình vận hành mới"} · Tuyến 1
          </DialogTitle>
          <DialogDescription>Lưu thành bản nháp, sau đó gửi Manager duyệt.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {NUM_FIELDS.map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`cfg-${key}`}>{label}</Label>
              <Input
                id={`cfg-${key}`}
                type="number"
                min={0}
                value={d[key]}
                onChange={(e) => set({ [key]: Number(e.target.value) })}
              />
              {key === "runningTimeMinutes" && d.runningTimeMinutes !== fromRoute && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => set({ runningTimeMinutes: fromRoute })}
                >
                  Dùng {fromRoute} phút tính từ bảng tuyến – ga
                </button>
              )}
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="cfg-start">Giờ bắt đầu</Label>
            <Input
              id="cfg-start"
              type="time"
              value={d.startTime}
              onChange={(e) => set({ startTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-end">Giờ kết thúc</Label>
            <Input
              id="cfg-end"
              type="time"
              value={d.endTime}
              onChange={(e) => set({ endTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-from">Hiệu lực từ ngày</Label>
            <Input
              id="cfg-from"
              type="date"
              value={d.effectiveFrom}
              onChange={(e) => set({ effectiveFrom: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-to">Đến ngày (không bắt buộc)</Label>
            <Input
              id="cfg-to"
              type="date"
              value={d.effectiveTo ?? ""}
              onChange={(e) => set({ effectiveTo: e.target.value || undefined })}
            />
          </div>
        </div>

        {!a.errors.length && (
          <div
            className={`rounded-lg border p-3 text-sm ${a.capacity.length ? "border-destructive/40 bg-destructive/5" : "border-success/40 bg-success/5"}`}
          >
            <p className="flex items-center gap-2 font-medium">
              {a.capacity.length ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              Cần tối thiểu {a.need.trains} đoàn tàu · khai báo {d.numberOfTrains} · tuyến có{" "}
              {availableTrains(d.lineId)} đoàn sẵn sàng
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Chu kỳ quay vòng = 2 × {d.runningTimeMinutes} + 2 × {d.turnaroundTimeMinutes} ={" "}
              {a.need.cycleMinutes} phút; số tàu tối thiểu = ⌈{a.need.cycleMinutes} ÷{" "}
              {d.headwayMinutes}⌉ = {a.need.trains}.
            </p>
            {a.capacity.map((e) => (
              <p key={e} className="mt-1 text-xs text-destructive">
                {e}. Vẫn lưu nháp được nhưng không gửi duyệt được.
              </p>
            ))}
            {a.warnings.map((w) => (
              <p key={w} className="mt-1 flex items-center gap-1 text-xs text-accent-foreground">
                <Info className="h-3.5 w-3.5" /> {w}
              </p>
            ))}
          </div>
        )}
        {a.errors.length > 0 && (
          <ul className="list-disc pl-5 text-sm text-destructive">
            {a.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onSave}>Lưu nháp</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
