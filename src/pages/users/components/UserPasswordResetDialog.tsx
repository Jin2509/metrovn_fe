import { useEffect, useRef, useState } from "react";
import { FieldError } from "@/components/form-field";
import { fieldErrorProps } from "@/components/form-field.utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidNewPassword } from "@/pages/profile/profile.service";

export function UserPasswordResetDialog({
  open,
  email,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  email?: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newPassword: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPassword("");
    setError("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Đặt lại mật khẩu?</AlertDialogTitle>
          <AlertDialogDescription>
            Mật khẩu mới sẽ được gửi tới {email}, và người dùng bị đăng xuất khỏi mọi thiết bị.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reset-password">Mật khẩu mới</Label>
          <Input
            ref={inputRef}
            id="reset-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            {...fieldErrorProps("reset-password", error)}
          />
          <FieldError fieldId="reset-password">{error}</FieldError>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <Button
            disabled={pending}
            onClick={() => {
              if (isValidNewPassword(password)) onConfirm(password);
              else {
                setError("Mật khẩu từ 8 ký tự, tối đa 72 byte, không được toàn khoảng trắng");
                inputRef.current?.focus();
              }
            }}
          >
            Xác nhận
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
