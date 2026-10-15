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
import type { PromotionDraft } from "@/pages/promotions/promotions.types";

export function PromotionFormDialog({
  open,
  draft,
  error,
  onOpenChange,
  onDraftChange,
  onSave,
}: {
  open: boolean;
  draft: PromotionDraft;
  error: string;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (draft: PromotionDraft) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo khuyến mãi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tên chương trình</Label>
            <Input
              value={draft.name}
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
            />
          </div>
          <div>
            <Label>Mức giảm (%)</Label>
            <Input
              type="number"
              value={draft.discount}
              onChange={(event) => onDraftChange({ ...draft, discount: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bắt đầu</Label>
              <Input
                type="date"
                value={draft.start}
                onChange={(event) => onDraftChange({ ...draft, start: event.target.value })}
              />
            </div>
            <div>
              <Label>Kết thúc</Label>
              <Input
                type="date"
                value={draft.end}
                onChange={(event) => onDraftChange({ ...draft, end: event.target.value })}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSave}>Lưu & gửi duyệt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
