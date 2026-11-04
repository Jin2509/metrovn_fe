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
  onChange,
}: {
  id: string;
  field: CatalogField<Draft>;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "select")
    return (
      <Select value={String(value ?? "")} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={field.label}>
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
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  const numeric = field.type === "number";
  return (
    <Input
      id={id}
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

/** Form thêm/sửa dựng từ khai báo trường của từng đối tượng. Lưu là gửi yêu cầu cho Manager. */
export function CatalogFormDialog({
  catalog,
  initial,
  editing,
  onClose,
  onSubmit,
}: {
  catalog: AnyCatalog;
  initial: Draft;
  editing: boolean;
  onClose: () => void;
  /** Trả về thông báo lỗi nếu không gửi được. */
  onSubmit: (draft: Draft) => string | null;
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
            setError(onSubmit(draft) ?? "");
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
                    field={field}
                    value={draft[field.key]}
                    onChange={(value) => setDraft({ ...draft, [field.key]: value })}
                  />
                  {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                </div>
              );
            })}
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Thay đổi chỉ có hiệu lực sau khi Manager phê duyệt.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="catalog-form">
            Gửi duyệt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
