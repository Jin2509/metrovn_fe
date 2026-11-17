import { AlertTriangle, LocateFixed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { FieldError } from "@/components/form-field";
import { fieldErrorProps, useFocusFirstInvalid } from "@/components/form-field.utils";
import { LazyMap } from "@/components/lazy-map";
import type { MapNetwork } from "@/components/metro-map";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { reverseGeocode } from "@/lib/geocode";
import { CODE_RULE, STATION_STATUS_LABELS } from "@/pages/stations/stations.service";
import type { StationDraft, StationErrors } from "@/pages/stations/stations.types";

type TextKey = "code" | "name" | "district" | "imageUrl" | "lat" | "lng";

/** Dấu * cho ô bắt buộc; trình đọc màn hình đọc qua `aria-required` của ô nhập. */
const Required = () => (
  <span aria-hidden className="text-destructive">
    {" "}
    *
  </span>
);

export function StationFormDialog({
  form,
  errors,
  warnings,
  pending,
  network,
  onChange,
  onClose,
  onSubmit,
}: {
  form: { id?: number; draft: StationDraft } | null;
  errors: StationErrors;
  /** Cảnh báo không chặn lưu (toạ độ xa TP.HCM, ga quá gần nhau…). */
  warnings: string[];
  pending: boolean;
  network: MapNetwork;
  onChange: (d: StationDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { ref, focusFirstInvalid } = useFocusFirstInvalid<HTMLDivElement>();
  const [addressHint, setAddressHint] = useState("");
  const [reversing, setReversing] = useState(false);
  if (!form) return null;
  const d = form.draft;
  const set = (patch: Partial<StationDraft>) => onChange({ ...d, ...patch });
  const text = (
    key: TextKey,
    label: string,
    { required, hint, ...props }: React.ComponentProps<typeof Input> & { hint?: string } = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`st-${key}`}>
        {label}
        {required && <Required />}
      </Label>
      <Input
        id={`st-${key}`}
        value={d[key]}
        onChange={(e) =>
          set({ [key]: key === "code" ? e.target.value.toUpperCase().trim() : e.target.value })
        }
        required={required}
        aria-required={required}
        {...props}
        {...fieldErrorProps(`st-${key}`, errors[key])}
      />
      <FieldError fieldId={`st-${key}`}>{errors[key]}</FieldError>
      {hint && !errors[key] && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  const picked = !!(d.lat.trim() && d.lng.trim() && Number.isFinite(lat) && Number.isFinite(lng));

  const fillAddressFromCoords = async () => {
    if (!picked || reversing) return;
    setReversing(true);
    try {
      const place = await reverseGeocode(lat, lng);
      if (!place) return toast.info("Không tìm thấy địa chỉ gần toạ độ này");
      set({ address: place.address, district: d.district.trim() || place.district });
      setAddressHint(`Đã lấy địa chỉ gần nhất theo toạ độ (${place.name}). Sửa lại nếu chưa đúng.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lấy được địa chỉ");
    } finally {
      setReversing(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Sửa thông tin ga" : "Thêm ga"}</DialogTitle>
          <DialogDescription>
            Gõ địa chỉ để chọn gợi ý địa điểm, bấm lên bản đồ để chọn vị trí ga, hoặc nhập vĩ
            độ/kinh độ. Ô có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>
        <div ref={ref} className="grid gap-4 sm:grid-cols-2">
          {text("code", "Mã ga", {
            required: true,
            maxLength: 20,
            placeholder: "VD: ST015",
            autoCapitalize: "characters",
            spellCheck: false,
            hint: CODE_RULE,
          })}
          {text("name", "Tên ga", { required: true, maxLength: 100, placeholder: "VD: Bến Thành" })}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="st-address">Địa chỉ</Label>
            <AddressAutocomplete
              id="st-address"
              value={d.address}
              maxLength={255}
              placeholder="Gõ tên đường hoặc địa điểm, ví dụ: Công trường Lam Sơn"
              near={picked ? { lat, lng } : null}
              onChange={(address) => {
                set({ address });
                setAddressHint("");
              }}
              onSelect={(place) => {
                set({
                  address: place.address,
                  district: place.district || d.district,
                  lat: String(place.lat),
                  lng: String(place.lng),
                });
                setAddressHint(
                  `Đã điền toạ độ và phường/xã theo "${place.name}". Kéo chấm trên bản đồ hoặc sửa vĩ độ/kinh độ nếu lối vào ga ở chỗ khác.`,
                );
              }}
              {...fieldErrorProps("st-address", errors.address)}
            />
            <FieldError fieldId="st-address">{errors.address}</FieldError>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {addressHint ||
                  "Gợi ý địa điểm từ OpenStreetMap. Chọn một gợi ý sẽ điền cả phường/xã và toạ độ."}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                disabled={!picked || reversing}
                title={
                  picked ? "Tra địa chỉ gần nhất theo vĩ độ/kinh độ đang nhập" : "Chọn vị trí trước"
                }
                onClick={() => void fillAddressFromCoords()}
              >
                <LocateFixed className="h-3.5 w-3.5" />
                {reversing ? "Đang tra…" : "Lấy địa chỉ từ toạ độ"}
              </Button>
            </div>
          </div>
          {text("district", "Phường/xã (quận/huyện)", {
            maxLength: 100,
            placeholder: "VD: Bến Thành",
          })}
          {text("imageUrl", "Ảnh ga (URL)", {
            maxLength: 500,
            placeholder: "https://…",
            type: "url",
            inputMode: "url",
          })}
          {text("lat", "Vĩ độ", {
            required: true,
            type: "number",
            step: "0.0000001",
            min: -90,
            max: 90,
            inputMode: "decimal",
            placeholder: "10.7769",
          })}
          {text("lng", "Kinh độ", {
            required: true,
            type: "number",
            step: "0.0000001",
            min: -180,
            max: 180,
            inputMode: "decimal",
            placeholder: "106.7009",
          })}
          <div className="sm:col-span-2">
            <LazyMap
              height={260}
              showBus={false}
              network={network}
              pickedPoint={picked ? { lat, lng } : null}
              onPickLocation={(la, ln) => set({ lat: la.toFixed(7), lng: ln.toFixed(7) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-status">Trạng thái</Label>
            <Select value={d.status} onValueChange={(v) => set({ status: v as StationApiStatus })}>
              <SelectTrigger id="st-status">
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
          {warnings.length > 0 && (
            <Alert className="sm:col-span-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc space-y-0.5 pl-4">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vẫn lưu được, nhưng hãy kiểm tra lại.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            Huỷ
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              onSubmit();
              focusFirstInvalid();
            }}
          >
            {pending ? "Đang lưu…" : form.id ? "Lưu thay đổi" : "Thêm ga"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
