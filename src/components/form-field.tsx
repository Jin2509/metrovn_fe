import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { errorId } from "@/components/form-field.utils";

/** Thông báo lỗi của một ô, kèm biểu tượng có chữ thay thế để lỗi không chỉ thể hiện bằng màu. */
export function FieldError({ fieldId, children }: { fieldId: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={errorId(fieldId)} className="flex items-start gap-1 text-xs text-destructive">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="sr-only">Lỗi: </span>
      <span>{children}</span>
    </p>
  );
}
