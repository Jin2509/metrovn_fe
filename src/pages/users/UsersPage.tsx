import { MapPinned, Plus, Users } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { ReasonDialog, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { AssignmentsPanel } from "@/pages/assignments";
import { UserCreateDialog } from "@/pages/users/components/UserCreateDialog";
import { UserDetailsSheet } from "@/pages/users/components/UserDetailsSheet";
import { UserFilters } from "@/pages/users/components/UserFilters";
import { UserPasswordResetDialog } from "@/pages/users/components/UserPasswordResetDialog";
import { UsersTable } from "@/pages/users/components/UsersTable";
import { useUsers } from "@/pages/users/hooks/useUsers";

function AccountsPanel() {
  const users = useUsers();

  return (
    <>
      <Section
        title="Danh sách tài khoản"
        description="Tài khoản nội bộ: Admin, Manager, Kế toán và nhân viên ga"
        action={
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
      </Section>
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
    </>
  );
}

export function UsersPage() {
  return (
    <AppShell title="Tài khoản & phân công">
      <PageTabs
        tabs={[
          { value: "accounts", label: "Tài khoản", icon: Users, content: <AccountsPanel /> },
          {
            value: "assignments",
            label: "Phân công ga",
            icon: MapPinned,
            content: <AssignmentsPanel />,
          },
        ]}
      />
    </AppShell>
  );
}
