import { useState } from "react";
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
import type { Attachment } from "@/mocks/requests";
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

  const close = () => {
    setNote("");
    setFiles([]);
    setError("");
    onClose();
  };

  const confirm = () => {
    if (!note.trim()) return setError("Vui lòng nhập nội dung");
    const picked = toAttachments(files);
    if (picked.error) return setError(picked.error);
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
        <Textarea
          aria-label={title}
          rows={4}
          placeholder={placeholder}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {withAttachments && <AttachmentPicker id="note-files" files={files} onChange={setFiles} />}
        {error && <p className="text-sm text-destructive">{error}</p>}
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
