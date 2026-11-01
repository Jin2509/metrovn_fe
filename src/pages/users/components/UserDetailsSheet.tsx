import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AdminUser, RoleResponse } from "@/lib/api";
import { userRoleLabel } from "@/pages/users/users.constants";

export function UserDetailsSheet({
  user,
  roleOptions,
  pending,
  onClose,
  onLock,
  onResetPassword,
  onSaveRoles,
}: {
  user: AdminUser | null;
  roleOptions: RoleResponse[];
  pending: boolean;
  onClose: () => void;
  onLock: () => void;
  onResetPassword: () => void;
  onSaveRoles: (user: AdminUser, roles: string[]) => void;
}) {
  const [roles, setRoles] = useState<string[]>([]);
  useEffect(() => setRoles(user?.roles ?? []), [user]);
  const rolesChanged =
    !!user && (roles.length !== user.roles.length || roles.some((r) => !user.roles.includes(r)));

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {user && (
          <>
            <SheetHeader>
              <SheetTitle>{user.fullName}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2 px-4 text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span> {user.email}
              </p>
              <p>
                <span className="text-muted-foreground">Vai trò:</span>{" "}
                {user.roles.map(userRoleLabel).join(", ")}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Trạng thái:</span>{" "}
                <StatusBadge s={user.status} />
              </p>
              <div className="flex flex-wrap gap-2 pt-4">
                <Button variant="outline" onClick={onResetPassword}>
                  Đặt lại mật khẩu
                </Button>
                {user.status === "LOCKED" ? (
                  <Button onClick={onLock}>Mở quyền</Button>
                ) : (
                  <Button variant="destructive" onClick={onLock}>
                    Chặn quyền
                  </Button>
                )}
              </div>
              {roleOptions.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <p className="font-medium">Đổi vai trò</p>
                  {roleOptions.map((option) => (
                    <div key={option.code} className="flex items-center gap-2">
                      <Checkbox
                        id={`user-role-${option.code}`}
                        checked={roles.includes(option.code)}
                        onCheckedChange={(checked) =>
                          setRoles((current) =>
                            checked
                              ? [...current, option.code]
                              : current.filter((code) => code !== option.code),
                          )
                        }
                      />
                      <Label htmlFor={`user-role-${option.code}`} className="font-normal">
                        {option.name}
                      </Label>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    disabled={pending || !rolesChanged || roles.length === 0}
                    onClick={() => onSaveRoles(user, roles)}
                  >
                    Lưu vai trò
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
