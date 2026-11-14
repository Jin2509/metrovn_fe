import { FieldError } from "@/components/form-field";
import { fieldErrorProps, useFocusFirstInvalid } from "@/components/form-field.utils";
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
import { LINE_STATUS_LABELS, type LineDraft, type LineErrors } from "@/pages/lines/lines.service";

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function LineFormDialog({
  form,
  errors,
  pending,
  onChange,
  onClose,
  onSubmit,
}: {
  form: { id?: number; draft: LineDraft } | null;
  errors: LineErrors;
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
            Sau khi tạo tuyến, thêm lần lượt từng ga ở bảng "Thứ tự ga".
          </DialogDescription>
        </DialogHeader>
        <div ref={ref} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="line-code">Mã tuyến</Label>
            <Input
              id="line-code"
              maxLength={20}
              value={d.code}
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
              required
              {...a11y("code")}
            />
            {error("code")}
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
            <Label htmlFor="line-name">Tên tuyến</Label>
            <Input
              id="line-name"
              maxLength={100}
              value={d.name}
              onChange={(e) => set({ name: e.target.value })}
              required
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
            <Label htmlFor="line-desc">Mô tả</Label>
            <Textarea
              id="line-desc"
              value={d.description}
              onChange={(e) => set({ description: e.target.value })}
              {...a11y("description")}
            />
            {error("description")}
          </div>
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
