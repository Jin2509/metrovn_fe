import { AppShell } from "@/components/app-shell";
import { BackendRolesPanel } from "@/pages/settings/components/BackendRolesPanel";
import { RoleMatrixPanel } from "@/pages/settings/components/RoleMatrixPanel";

/** Vai trò & phân quyền: bảng vai trò lấy từ API /api/admin/roles, ma trận màn hình sinh từ permissions.ts. */
export function SettingsPage() {
  return (
    <AppShell title="Vai trò & phân quyền">
      <BackendRolesPanel />
      <RoleMatrixPanel />
    </AppShell>
  );
}
