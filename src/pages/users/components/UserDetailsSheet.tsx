import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { USER_ROLE_LABELS } from "@/pages/users/users.constants";
import type { User } from "@/mocks/admin";

export function UserDetailsSheet({
  user,
  stationName,
  onClose,
  onLock,
  onResetPassword,
}: {
  user: User | null;
  stationName: string;
  onClose: () => void;
  onLock: () => void;
  onResetPassword: () => void;
}) {
  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {user && (
          <>
            <SheetHeader>
              <SheetTitle>{user.name}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2 px-4 text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span> {user.email}
              </p>
              <p>
                <span className="text-muted-foreground">Vai trò:</span>{" "}
                {USER_ROLE_LABELS[user.role]}
              </p>
              <p>
                <span className="text-muted-foreground">Ga phụ trách:</span> {stationName}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Trạng thái:</span>{" "}
                <StatusBadge s={user.status} />
              </p>
              {user.lockReason && <p className="text-destructive">Lý do khóa: {user.lockReason}</p>}
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
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
