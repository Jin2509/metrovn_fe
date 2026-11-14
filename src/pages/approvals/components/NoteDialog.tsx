import { useId, useRef, useState } from "react";
import { FieldError } from "@/components/form-field";
import { fieldErrorProps } from "@/components/form-field.utils";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Attachment } from "@/stores/requests";
import { AttachmentPicker } from "@/pages/approvals/components/RequestAttachments";
import { toAttachments } from "@/pages/approvals/work-requests.service";

/** Hộp nhập ghi chú bắt buộc, có thể kèm tệp (hỏi lại Manager, báo kết quả, lý do…). */
export function NoteDialog({
  open,
  title,
  description,
  placeholder,
  confirmLabel,
  withAttachments = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  placeholder: string;
  confirmLabel: string;
  withAttachments?: boolean;
  onClose: () => void;
  /** Trả về thông báo lỗi để giữ hộp thoại mở. */
  onConfirm: (note: string, attachments: Attachment[]) => string | null;
}) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const fieldId = useId();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const fail = (message: string) => {
    setError(message);
    noteRef.current?.focus();
  };

  const close = () => {
    setNote("");
    setFiles([]);
    setError("");
    onClose();
  };

  const confirm = () => {
    if (!note.trim()) return fail("Vui lòng nhập nội dung");
    const picked = toAttachments(files);
    if (picked.error) return fail(picked.error);
    const failed = onConfirm(note.trim(), picked.attachments);
    if (failed) return toast.error(failed);
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor={fieldId}>
            Nội dung <span aria-hidden>*</span>
          </Label>
          <Textarea
            ref={noteRef}
            id={fieldId}
            rows={4}
            required
            placeholder={placeholder}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            {...fieldErrorProps(fieldId, error)}
          />
          <FieldError fieldId={fieldId}>{error}</FieldError>
        </div>
        {withAttachments && <AttachmentPicker id="note-files" files={files} onChange={setFiles} />}
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button onClick={confirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
