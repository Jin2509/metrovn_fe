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
import type { RoleResponse } from "@/lib/api";
import type { UserCreateDraft, UserCreateErrors } from "@/pages/users/users.types";

export function UserCreateDialog({
  open,
  draft,
  errors,
  roleOptions,
  pending,
  onClose,
  onDraftChange,
  onSubmit,
}: {
  open: boolean;
  draft: UserCreateDraft;
  errors: UserCreateErrors;
  roleOptions: RoleResponse[];
  pending: boolean;
  onClose: () => void;
  onDraftChange: (draft: UserCreateDraft) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo tài khoản nội bộ</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Họ tên</Label>
            <Input
              value={draft.name}
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={draft.email}
              onChange={(event) => onDraftChange({ ...draft, email: event.target.value })}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label>Vai trò</Label>
            <Select value={draft.role} onValueChange={(role) => onDraftChange({ ...draft, role })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Tài khoản được kích hoạt ngay. Hệ thống tự sinh mật khẩu và gửi qua email.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={pending} onClick={onSubmit}>
            Tạo tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
