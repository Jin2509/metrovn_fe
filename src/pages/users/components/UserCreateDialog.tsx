import { FieldError } from "@/components/form-field";
import { fieldErrorProps, useFocusFirstInvalid } from "@/components/form-field.utils";
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
  const { ref, focusFirstInvalid } = useFocusFirstInvalid<HTMLDivElement>();
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo tài khoản nội bộ</DialogTitle>
        </DialogHeader>
        <div ref={ref} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Họ tên</Label>
            {/* Thông tin của người khác, không phải của người đang đăng nhập: tắt tự điền. */}
            <Input
              id="user-name"
              autoComplete="off"
              required
              value={draft.name}
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              {...fieldErrorProps("user-name", errors.name)}
            />
            <FieldError fieldId="user-name">{errors.name}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              spellCheck={false}
              required
              value={draft.email}
              onChange={(event) => onDraftChange({ ...draft, email: event.target.value })}
              {...fieldErrorProps("user-email", errors.email)}
            />
            <FieldError fieldId="user-email">{errors.email}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-role">Vai trò</Label>
            <Select value={draft.role} onValueChange={(role) => onDraftChange({ ...draft, role })}>
              <SelectTrigger id="user-role">
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
          <Button
            disabled={pending}
            onClick={() => {
              onSubmit();
              focusFirstInvalid();
            }}
          >
            Tạo tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
