import { AlertCircle, Plus } from "lucide-react";
import { DataTable, Section, type Col } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RoleResponse } from "@/lib/api";
import { useRbac } from "@/pages/settings/hooks/useRbac";

/** Vai trò `ADMIN` luôn giữ mọi quyền: backend từ chối sửa. */
const LOCKED_ROLE = "ADMIN";

/** Vai trò và quyền đang áp dụng ở máy chủ: xem, tạo vai trò mới, đổi quyền của vai trò. */
export function BackendRolesPanel() {
  const rbac = useRbac();
  const cols: Col<RoleResponse>[] = [
    { h: "Mã", c: (role) => <span className="font-medium">{role.code}</span> },
    { h: "Tên", c: (role) => role.name },
    {
      h: "Loại",
      c: (role) => <Badge variant="outline">{role.system ? "Hệ thống" : "Tự tạo"}</Badge>,
    },
    { h: "Số quyền", c: (role) => role.permissions.length },
  ];
  const editor = rbac.editor;
  const togglePermission = (code: string, checked: boolean) => {
    if (!editor) return;
    const { draft } = editor;
    rbac.setDraft({
      ...draft,
      permissions: checked
        ? [...draft.permissions, code]
        : draft.permissions.filter((item) => item !== code),
    });
  };

  return (
    <Section
      title="Vai trò trên máy chủ"
      description="Web nhận diện 3 mã vai trò: ADMIN, MANAGER, ACCOUNTANT. Bấm một dòng để đổi quyền."
      action={
        <Button onClick={() => rbac.open(true)}>
          <Plus className="h-4 w-4" />
          Thêm vai trò
        </Button>
      }
    >
      {rbac.loadError && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{rbac.loadError}</AlertDescription>
        </Alert>
      )}
      <DataTable
        rows={rbac.roles}
        cols={cols}
        empty={rbac.loading ? "Đang tải dữ liệu…" : "Chưa có vai trò"}
        onRow={(role) =>
          role.code !== LOCKED_ROLE &&
          rbac.open(false, { code: role.code, name: role.name, permissions: role.permissions })
        }
      />
      <Dialog open={!!editor} onOpenChange={(open) => !open && rbac.close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor?.isNew ? "Thêm vai trò" : `Đổi quyền của ${editor?.draft.code}`}
            </DialogTitle>
          </DialogHeader>
          {editor && (
            <div className="space-y-3">
              {editor.isNew && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="role-code">Mã vai trò</Label>
                    <Input
                      id="role-code"
                      placeholder="MANAGER"
                      value={editor.draft.code}
                      onChange={(event) =>
                        rbac.setDraft({ ...editor.draft, code: event.target.value.toUpperCase() })
                      }
                    />
                    {rbac.errors.code && (
                      <p className="text-xs text-destructive">{rbac.errors.code}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="role-name">Tên vai trò</Label>
                    <Input
                      id="role-name"
                      value={editor.draft.name}
                      onChange={(event) =>
                        rbac.setDraft({ ...editor.draft, name: event.target.value })
                      }
                    />
                    {rbac.errors.name && (
                      <p className="text-xs text-destructive">{rbac.errors.name}</p>
                    )}
                  </div>
                </>
              )}
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {rbac.permissions.map((permission) => (
                  <div key={permission.code} className="flex items-start gap-2">
                    <Checkbox
                      id={`perm-${permission.code}`}
                      checked={editor.draft.permissions.includes(permission.code)}
                      onCheckedChange={(checked) =>
                        togglePermission(permission.code, checked === true)
                      }
                    />
                    <Label htmlFor={`perm-${permission.code}`} className="block font-normal">
                      <span className="block font-medium">{permission.description}</span>
                      <span className="text-xs text-muted-foreground">{permission.code}</span>
                    </Label>
                  </div>
                ))}
              </div>
              {!editor.isNew && (
                <p className="text-xs text-muted-foreground">
                  Danh sách này thay thế toàn bộ quyền hiện có và có hiệu lực ngay.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={rbac.close}>
              Hủy
            </Button>
            <Button disabled={rbac.pending} onClick={rbac.submit}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
