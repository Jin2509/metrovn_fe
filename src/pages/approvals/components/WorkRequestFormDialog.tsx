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
import type { WorkCategory, WorkPriority } from "@/mocks/requests";
import { AttachmentPicker } from "@/pages/approvals/components/RequestAttachments";
import { WORK_CATEGORY_LABELS, WORK_PRIORITY } from "@/pages/approvals/work-requests.constants";
import {
  createWorkRequest,
  toAttachments,
  validateWorkRequest,
} from "@/pages/approvals/work-requests.service";

type Draft = {
  category: WorkCategory;
  title: string;
  description: string;
  priority: WorkPriority;
  dueDate: string;
};
const EMPTY: Draft = {
  category: "OTHER",
  title: "",
  description: "",
  priority: "NORMAL",
  dueDate: "",
};

/** Manager gửi yêu cầu cho Admin: mô tả tự do kèm tệp (bảng giá, công văn, ảnh chụp…). */
export function WorkRequestFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft | "files", string>>>({});

  const close = () => {
    setDraft(EMPTY);
    setFiles([]);
    setErrors({});
    onOpenChange(false);
  };

  const submit = () => {
    const picked = toAttachments(files);
    const input = { ...draft, attachments: picked.attachments };
    const nextErrors = {
      ...validateWorkRequest(input),
      ...(picked.error && { files: picked.error }),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const id = createWorkRequest(input);
    toast.success("Đã gửi yêu cầu cho Admin");
    close();
    onCreated(id);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Gửi yêu cầu cho Admin</DialogTitle>
          <DialogDescription>
            Nếu việc cần sửa dữ liệu, Admin sẽ gửi lại đề xuất thay đổi để bạn duyệt. Yêu cầu tự
            hoàn tất khi đề xuất đó được duyệt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wr-title">Tiêu đề</Label>
            <Input
              id="wr-title"
              value={draft.title}
              placeholder="vd. Cập nhật giá gửi xe theo bảng giá mới"
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Nhóm</Label>
              <Select
                value={draft.category}
                onValueChange={(category) =>
                  setDraft({ ...draft, category: category as WorkCategory })
                }
              >
                <SelectTrigger aria-label="Nhóm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(WORK_CATEGORY_LABELS) as WorkCategory[]).map((category) => (
                    <SelectItem key={category} value={category}>
                      {WORK_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ưu tiên</Label>
              <Select
                value={draft.priority}
                onValueChange={(priority) =>
                  setDraft({ ...draft, priority: priority as WorkPriority })
                }
              >
                <SelectTrigger aria-label="Ưu tiên">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(WORK_PRIORITY) as WorkPriority[]).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {WORK_PRIORITY[priority].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wr-due">Hạn xử lý</Label>
              <Input
                id="wr-due"
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
              />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wr-desc">Mô tả</Label>
            <Textarea
              id="wr-desc"
              rows={5}
              value={draft.description}
              placeholder="Cần làm gì, áp dụng từ khi nào, căn cứ nào…"
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wr-files">Tệp đính kèm</Label>
            <AttachmentPicker id="wr-files" files={files} onChange={setFiles} />
            <p className="text-xs text-muted-foreground">
              PDF, Word, Excel, CSV, ảnh. Tối đa 5 tệp, mỗi tệp 20MB.
            </p>
            {errors.files && <p className="text-xs text-destructive">{errors.files}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button onClick={submit}>Gửi yêu cầu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
