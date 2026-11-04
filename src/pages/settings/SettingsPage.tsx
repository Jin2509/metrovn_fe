import { AppShell } from "@/components/app-shell";
import { BackendRolesPanel } from "@/pages/settings/components/BackendRolesPanel";

/** Vai trò & phân quyền: bảng vai trò lấy từ API /api/admin/roles. */
export function SettingsPage() {
  return (
    <AppShell title="Vai trò & phân quyền">
      <BackendRolesPanel />
    </AppShell>
  );
}
