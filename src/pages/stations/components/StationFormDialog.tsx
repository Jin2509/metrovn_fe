import { LazyMap } from "@/components/lazy-map";
import type { MapNetwork } from "@/components/metro-map";
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
import type { StationApiStatus } from "@/lib/api";
import { STATION_STATUS_LABELS } from "@/pages/stations/stations.service";
import type { StationDraft, StationErrors } from "@/pages/stations/stations.types";

type TextKey = "code" | "name" | "address" | "district" | "imageUrl" | "lat" | "lng";

export function StationFormDialog({
  form,
  errors,
  pending,
  network,
  onChange,
  onClose,
  onSubmit,
}: {
  form: { id?: number; draft: StationDraft } | null;
  errors: StationErrors;
  pending: boolean;
  network: MapNetwork;
  onChange: (d: StationDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!form) return null;
  const d = form.draft;
  const set = (patch: Partial<StationDraft>) => onChange({ ...d, ...patch });
  const text = (key: TextKey, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`st-${key}`}>{label}</Label>
      <Input
        id={`st-${key}`}
        value={d[key]}
        onChange={(e) =>
          set({ [key]: key === "code" ? e.target.value.toUpperCase() : e.target.value })
        }
        {...props}
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  const picked = d.lat.trim() && d.lng.trim() && Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Sửa thông tin ga" : "Thêm ga"}</DialogTitle>
          <DialogDescription>
            Bấm lên bản đồ để chọn vị trí ga, hoặc nhập vĩ độ/kinh độ.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("code", "Mã ga", { maxLength: 20 })}
          {text("name", "Tên ga", { maxLength: 100 })}
          {text("address", "Địa chỉ", { maxLength: 255 })}
          {text("district", "Quận/huyện", { maxLength: 100 })}
          {text("lat", "Vĩ độ", { type: "number", step: "0.0000001" })}
          {text("lng", "Kinh độ", { type: "number", step: "0.0000001" })}
          <div className="sm:col-span-2">
            {text("imageUrl", "Ảnh ga (URL)", { maxLength: 500, placeholder: "https://…" })}
          </div>
          <div className="sm:col-span-2">
            <LazyMap
              height={260}
              showBus={false}
              network={network}
              pickedPoint={picked ? { lat, lng } : null}
              onPickLocation={(la, ln) => set({ lat: String(la), lng: String(ln) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select value={d.status} onValueChange={(v) => set({ status: v as StationApiStatus })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATION_STATUS_LABELS) as StationApiStatus[]).map((s) => (
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
            <span className="text-xs text-muted-foreground">(tự bật khi tạo chuyển tuyến)</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={pending} onClick={onSubmit}>
            {pending ? "Đang lưu…" : form.id ? "Lưu thay đổi" : "Thêm ga"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
