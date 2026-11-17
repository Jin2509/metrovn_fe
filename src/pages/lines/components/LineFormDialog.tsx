import { AlertTriangle } from "lucide-react";
import { FieldError } from "@/components/form-field";
import { fieldErrorProps, useFocusFirstInvalid } from "@/components/form-field.utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LineStatus } from "@/lib/api";
import {
  LINE_DESCRIPTION_MAX,
  LINE_STATUS_LABELS,
  type LineDraft,
  type LineErrors,
} from "@/pages/lines/lines.service";
import { CODE_RULE } from "@/pages/stations/stations.service";

const HEX = /^#[0-9A-Fa-f]{6}$/;

const Required = () => (
  <span aria-hidden className="text-destructive">
    {" "}
    *
  </span>
);

export function LineFormDialog({
  form,
  errors,
  warnings,
  pending,
  onChange,
  onClose,
  onSubmit,
}: {
  form: { id?: number; draft: LineDraft } | null;
  errors: LineErrors;
  /** Cảnh báo không chặn lưu (trùng màu với tuyến khác…). */
  warnings: string[];
  pending: boolean;
  onChange: (draft: LineDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { ref, focusFirstInvalid } = useFocusFirstInvalid<HTMLDivElement>();
  if (!form) return null;
  const d = form.draft;
  const set = (patch: Partial<LineDraft>) => onChange({ ...d, ...patch });
  const fieldIds: Record<keyof LineDraft, string> = {
    code: "line-code",
    name: "line-name",
    colorHex: "line-color",
    description: "line-desc",
    status: "line-status",
  };
  const error = (key: keyof LineDraft) => (
    <FieldError fieldId={fieldIds[key]}>{errors[key]}</FieldError>
  );
  const a11y = (key: keyof LineDraft) => fieldErrorProps(fieldIds[key], errors[key]);

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Sửa thông tin tuyến" : "Thêm tuyến"}</DialogTitle>
          <DialogDescription>
            Sau khi tạo tuyến, thêm lần lượt từng ga ở bảng "Thứ tự ga". Ô có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>
        <div ref={ref} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="line-code">
              Mã tuyến
              <Required />
            </Label>
            <Input
              id="line-code"
              maxLength={20}
              placeholder="VD: BTS-02"
              autoCapitalize="characters"
              spellCheck={false}
              value={d.code}
              onChange={(e) => set({ code: e.target.value.toUpperCase().trim() })}
              required
              aria-required
              {...a11y("code")}
            />
            {error("code")}
            {!errors.code && <p className="text-xs text-muted-foreground">{CODE_RULE}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line-status">Trạng thái</Label>
            <Select value={d.status} onValueChange={(v) => set({ status: v as LineStatus })}>
              <SelectTrigger id="line-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LINE_STATUS_LABELS) as LineStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {LINE_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="line-name">
              Tên tuyến
              <Required />
            </Label>
            <Input
              id="line-name"
              maxLength={100}
              placeholder="VD: Bến Thành - Tham Lương"
              value={d.name}
              onChange={(e) => set({ name: e.target.value })}
              required
              aria-required
              {...a11y("name")}
            />
            {error("name")}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="line-color">Màu tuyến</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Chọn màu tuyến"
                className="h-9 w-12 cursor-pointer rounded border bg-transparent"
                value={HEX.test(d.colorHex) ? d.colorHex : "#000000"}
                onChange={(e) => set({ colorHex: e.target.value.toUpperCase() })}
              />
              <Input
                id="line-color"
                placeholder="#RRGGBB (bỏ trống nếu chưa có)"
                value={d.colorHex}
                onChange={(e) => set({ colorHex: e.target.value })}
                {...a11y("colorHex")}
              />
            </div>
            {error("colorHex")}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="line-desc">Mô tả</Label>
              <span className="text-xs text-muted-foreground">
                {d.description.length}/{LINE_DESCRIPTION_MAX}
              </span>
            </div>
            <Textarea
              id="line-desc"
              maxLength={LINE_DESCRIPTION_MAX}
              value={d.description}
              onChange={(e) => set({ description: e.target.value })}
              {...a11y("description")}
            />
            {error("description")}
          </div>
          {warnings.length > 0 && (
            <Alert className="sm:col-span-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc space-y-0.5 pl-4">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
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
            {pending ? "Đang lưu…" : form.id ? "Lưu thay đổi" : "Tạo tuyến"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
