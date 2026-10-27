import { LazyMap } from "@/components/lazy-map";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATION_STATUS_LABELS, type StationDraft, type StationErrors } from "@/lib/network";
import type { StationStatus } from "@/mocks/metro";

export function StationFormDialog({
  form,
  errors,
  onChange,
  onClose,
  onSubmit,
}: {
  form: { id?: string; draft: StationDraft } | null;
  errors: StationErrors;
  onChange: (d: StationDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!form) return null;
  const d = form.draft;
  const set = (patch: Partial<StationDraft>) => onChange({ ...d, ...patch });
  const text = (key: "code" | "name" | "address" | "district", label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`st-${key}`}>{label}</Label>
      <Input
        id={`st-${key}`}
        value={d[key]}
        onChange={(e) =>
          set({ [key]: key === "code" ? e.target.value.toUpperCase() : e.target.value })
        }
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Sửa thông tin ga" : "Thêm ga"}</DialogTitle>
          <DialogDescription>
            Bấm lên bản đồ để chọn vị trí ga, hoặc nhập vĩ độ/kinh độ. Yêu cầu sẽ được gửi cho
            Manager duyệt — thông tin ga chỉ thay đổi sau khi được phê duyệt.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("code", "Mã ga")}
          {text("name", "Tên ga")}
          {text("address", "Địa chỉ")}
          {text("district", "Quận/huyện")}
          <div className="space-y-1.5">
            <Label htmlFor="st-lat">Vĩ độ</Label>
            <Input
              id="st-lat"
              type="number"
              step="0.0000001"
              value={d.lat}
              onChange={(e) => set({ lat: Number(e.target.value) })}
            />
            {errors.lat && <p className="text-xs text-destructive">{errors.lat}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-lng">Kinh độ</Label>
            <Input
              id="st-lng"
              type="number"
              step="0.0000001"
              value={d.lng}
              onChange={(e) => set({ lng: Number(e.target.value) })}
            />
            {errors.lng && <p className="text-xs text-destructive">{errors.lng}</p>}
          </div>
          <div className="sm:col-span-2">
            <LazyMap
              height={260}
              showBus={false}
              pickedPoint={d}
              onPickLocation={(lat, lng) => set({ lat, lng })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select value={d.status} onValueChange={(v) => set({ status: v as StationStatus })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATION_STATUS_LABELS) as StationStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATION_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <Checkbox checked={d.interchange} onCheckedChange={(v) => set({ interchange: !!v })} />
            Ga chuyển tuyến
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>Gửi duyệt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
