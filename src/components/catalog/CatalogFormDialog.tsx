import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import type { AnyCatalog, CatalogField } from "@/lib/change-requests";

type Draft = Record<string, unknown>;

function Field({
  id,
  field,
  value,
  describedBy,
  disabled,
  onChange,
}: {
  id: string;
  field: CatalogField<Draft>;
  value: unknown;
  disabled?: boolean;
  /** id của dòng gợi ý bên dưới ô. */
  describedBy?: string;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "select")
    return (
      <Select value={String(value ?? "")} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} aria-describedby={describedBy}>
          <SelectValue placeholder="Chọn…" />
        </SelectTrigger>
        <SelectContent>
          {field.options?.().map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  if (field.type === "textarea")
    return (
      <Textarea
        id={id}
        aria-describedby={describedBy}
        disabled={disabled}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  const numeric = field.type === "number";
  return (
    <Input
      id={id}
      aria-describedby={describedBy}
      disabled={disabled}
      type={field.type ?? "text"}
      min={field.min}
      max={field.max}
      value={numeric ? ((value as number | string) ?? "") : String(value ?? "")}
      onChange={(event) =>
        onChange(
          numeric && event.target.value !== "" ? Number(event.target.value) : event.target.value,
        )
      }
    />
  );
}

/** Form thêm/sửa dựng từ khai báo trường của từng đối tượng, lưu thẳng lên backend. */
export function CatalogFormDialog({
  catalog,
  initial,
  editing,
  pending = false,
  onClose,
  onSubmit,
}: {
  catalog: AnyCatalog;
  initial: Draft;
  editing: boolean;
  pending?: boolean;
  onClose: () => void;
  /** Trả về thông báo lỗi nếu không lưu được. */
  onSubmit: (draft: Draft) => Promise<string | null>;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState("");
  const fields = catalog.fields as CatalogField<Draft>[];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Sửa" : "Thêm"} {catalog.noun}
          </DialogTitle>
        </DialogHeader>
        <form
          id="catalog-form"
          noValidate
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (pending) return;
            void onSubmit(draft).then((message) => setError(message ?? ""));
          }}
        >
          {fields
            .filter((field) => !field.visible || field.visible(draft))
            .map((field) => {
              const id = `catalog-${field.key}`;
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={id}>{field.label}</Label>
                  <Field
                    id={id}
                    describedBy={field.hint ? `${id}-hint` : undefined}
                    field={field}
                    disabled={editing && field.createOnly}
                    value={draft[field.key]}
                    onChange={(value) => setDraft({ ...draft, [field.key]: value })}
                  />
                  {field.hint && (
                    <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                      {field.hint}
                    </p>
                  )}
                </div>
              );
            })}
        </form>
        {/* Lỗi chung của cả form, hiện ngay sau khi bấm gửi nên đọc luôn. */}
        <div role="alert">
          {error && (
            <p className="flex items-start gap-1.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="sr-only">Lỗi: </span>
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="catalog-form" disabled={pending}>
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
