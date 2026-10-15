import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ReasonDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { UserCreateDialog } from "@/pages/users/components/UserCreateDialog";
import { UserDetailsSheet } from "@/pages/users/components/UserDetailsSheet";
import { UserFilters } from "@/pages/users/components/UserFilters";
import { UserPasswordResetDialog } from "@/pages/users/components/UserPasswordResetDialog";
import { UsersTable } from "@/pages/users/components/UsersTable";
import { useUsers } from "@/pages/users/hooks/useUsers";

export function UsersPage() {
  const users = useUsers();

  return (
    <AppShell
      title="Người dùng"
      roles={["ADMIN"]}
      actions={
        <Button onClick={() => users.setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo tài khoản
        </Button>
      }
    >
      <UserFilters
        query={users.query}
        role={users.role}
        status={users.status}
        onQueryChange={users.setQuery}
        onRoleChange={users.setRole}
        onStatusChange={users.setStatus}
      />
      <UsersTable rows={users.rows} onSelect={users.setSelectedUser} />
      <UserDetailsSheet
        user={users.selectedUser}
        stationName={users.selectedStationName}
        onClose={() => users.setSelectedUser(null)}
        onLock={() => users.setLockOpen(true)}
        onResetPassword={() => users.setResetOpen(true)}
      />
      <ReasonDialog
        open={users.lockOpen}
        title={
          users.selectedUser?.status === "LOCKED" ? "Mở quyền tài khoản" : "Chặn quyền tài khoản"
        }
        onClose={() => users.setLockOpen(false)}
        onConfirm={users.confirmLock}
      />
      <UserPasswordResetDialog
        open={users.resetOpen}
        email={users.selectedUser?.email}
        onOpenChange={users.setResetOpen}
        onConfirm={users.confirmPasswordReset}
      />
      <UserCreateDialog
        open={users.createOpen}
        draft={users.createDraft}
        errors={users.createErrors}
        onClose={() => users.setCreateOpen(false)}
        onDraftChange={users.setCreateDraft}
        onSubmit={users.submitCreate}
      />
    </AppShell>
  );
}
