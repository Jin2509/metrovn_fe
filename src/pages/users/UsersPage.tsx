import { MapPinned, Plus, UserRound, Users } from "lucide-react";
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
import { INTERNAL_ROLES } from "@/pages/users/users.constants";
import type { UserScope } from "@/pages/users/users.types";

const SCOPE_TEXT: Record<UserScope, { title: string; description: string }> = {
  internal: {
    title: "Nhân sự nội bộ",
    description: "Manager, Kế toán và nhân viên ga. Tạo tài khoản mới cần Manager duyệt.",
  },
  passenger: {
    title: "Tài khoản hành khách",
    description: "Người dùng app đặt vé. Khóa tài khoản khi có gian lận hoặc theo yêu cầu.",
  },
};

function AccountsPanel({ scope }: { scope: UserScope }) {
  const users = useUsers(scope);
  const text = SCOPE_TEXT[scope];

  return (
    <>
      <Section
        title={text.title}
        description={`${text.description} ${users.total} tài khoản, ${users.lockedCount} đang khóa.`}
        action={
          scope === "internal" && (
            <Button onClick={() => users.setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Tạo tài khoản
            </Button>
          )
        }
      >
        <UserFilters
          query={users.query}
          role={users.role}
          roles={scope === "internal" ? INTERNAL_ROLES : undefined}
          status={users.status}
          onQueryChange={users.setQuery}
          onRoleChange={users.setRole}
          onStatusChange={users.setStatus}
        />
        <UsersTable rows={users.rows} scope={scope} onSelect={users.setSelectedUser} />
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
          {
            value: "accounts",
            label: "Nhân sự nội bộ",
            icon: Users,
            content: <AccountsPanel scope="internal" />,
          },
          {
            value: "passengers",
            label: "Hành khách",
            icon: UserRound,
            content: <AccountsPanel scope="passenger" />,
          },
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
