import { AppShell } from "@/components/app-shell";
import { RoleMatrixPanel } from "@/pages/settings/components/RoleMatrixPanel";

/** Vai trò & phân quyền — tương ứng bảng role, functions, permission và API /api/admin/roles của backend. */
export function SettingsPage() {
  return (
    <AppShell title="Vai trò & phân quyền">
      <RoleMatrixPanel />
    </AppShell>
  );
}
