import { useNavigate } from "@tanstack/react-router";
import { ClipboardList, FileCheck2, Inbox, Plus, Send } from "lucide-react";
import { AppShell, PageTabs, type PageTab } from "@/components/app-shell";
import { ReasonDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useAuth, type Role } from "@/lib/auth";
import { PoliciesPanel } from "@/pages/policies";
import { ApprovalDetailSheet } from "@/pages/approvals/components/ApprovalDetailSheet";
import { ApprovalListSection } from "@/pages/approvals/components/ApprovalListSection";
import { ApprovalTypeTabs } from "@/pages/approvals/components/ApprovalTypeTabs";
import { WorkRequestDetailSheet } from "@/pages/approvals/components/WorkRequestDetailSheet";
import { WorkRequestFormDialog } from "@/pages/approvals/components/WorkRequestFormDialog";
import { WorkRequestListSection } from "@/pages/approvals/components/WorkRequestListSection";
import { useApprovals } from "@/pages/approvals/hooks/useApprovals";
import { useWorkRequests } from "@/pages/approvals/hooks/useWorkRequests";

/**
 * Hộp yêu cầu hai chiều (luồng chi tiết: `managerflow.md` ở gốc dự án).
 * - Manager: duyệt đề xuất của Admin · gửi yêu cầu cho Admin · xem chính sách đang áp dụng.
 * - Admin: xử lý yêu cầu từ Manager · theo dõi đề xuất mình đã gửi (chỉ xem, không tự duyệt).
 */
const TABS: Record<"MANAGER" | "ADMIN", { approvals: string; work: string; first: string }> = {
  MANAGER: { approvals: "inbox", work: "sent", first: "inbox" },
  ADMIN: { approvals: "proposals", work: "work", first: "work" },
};

/** Mở một yêu cầu bất kỳ: A… là đề xuất của Admin, W… là yêu cầu của Manager. Tự chuyển đúng tab. */
function useOpenRequest(role: "MANAGER" | "ADMIN") {
  const navigate = useNavigate();
  return (id: string) => {
    const tabs = TABS[role];
    const tab = id.startsWith("W") ? tabs.work : tabs.approvals;
    navigate({
      to: "/approvals",
      search: { tab: tab === tabs.first ? undefined : tab, request: id },
      replace: true,
    } as never);
  };
}

function ApprovalInboxPanel({ role }: { role: "MANAGER" | "ADMIN" }) {
  const manager = role === "MANAGER";
  const openRequest = useOpenRequest(role);
  const {
    rows,
    tab,
    setTab,
    status,
    setStatus,
    selected,
    setSelected,
    rejectOpen,
    setRejectOpen,
    decide,
  } = useApprovals(manager ? "PENDING" : "ALL");

  return (
    <>
      <ApprovalTypeTabs value={tab} onValueChange={setTab} />
      <ApprovalListSection
        title={manager ? "Đề xuất chờ bạn duyệt" : "Đề xuất đã gửi Manager"}
        description={
          manager
            ? "Thay đổi dữ liệu do Admin đề xuất. Dữ liệu chỉ được ghi khi bạn phê duyệt."
            : "Theo dõi kết quả duyệt. Có thể trao đổi thêm với Manager khi đề xuất còn chờ."
        }
        rows={rows}
        status={status}
        onStatusChange={setStatus}
        onSelect={setSelected}
      />
      <ApprovalDetailSheet
        approval={selected}
        onClose={() => setSelected(null)}
        onApprove={() => decide("APPROVED")}
        onReject={() => setRejectOpen(true)}
        onOpenWorkRequest={openRequest}
      />
      <ReasonDialog
        open={rejectOpen}
        title="Từ chối yêu cầu"
        confirmLabel="Từ chối"
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => decide("REJECTED", reason)}
      />
    </>
  );
}

function WorkRequestPanel({ role }: { role: "MANAGER" | "ADMIN" }) {
  const manager = role === "MANAGER";
  const openRequest = useOpenRequest(role);
  const { rows, approvals, filter, setFilter, formOpen, setFormOpen, selected, select } =
    useWorkRequests(role);

  return (
    <>
      <WorkRequestListSection
        title={manager ? "Yêu cầu đã gửi Admin" : "Yêu cầu từ Manager"}
        description={
          manager
            ? "Việc bạn giao cho Admin: sửa cấu hình, sửa lỗi, xuất báo cáo… kèm tin nhắn và tệp."
            : "Nhận việc, hỏi lại khi thiếu thông tin. Việc cần sửa dữ liệu thì gửi đề xuất để Manager duyệt."
        }
        rows={rows}
        approvals={approvals}
        filter={filter}
        onFilterChange={setFilter}
        onSelect={(request) => select(request.id)}
        action={
          manager && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Gửi yêu cầu
            </Button>
          )
        }
      />
      <WorkRequestDetailSheet
        request={selected}
        approvals={approvals}
        onClose={() => select(null)}
        onOpenApproval={(approval) => openRequest(approval.id)}
      />
      {manager && (
        <WorkRequestFormDialog open={formOpen} onOpenChange={setFormOpen} onCreated={select} />
      )}
    </>
  );
}

function tabsFor(role: Role | null): PageTab[] {
  if (role === "MANAGER")
    return [
      {
        value: "inbox",
        label: "Cần tôi duyệt",
        icon: Inbox,
        content: <ApprovalInboxPanel role="MANAGER" />,
      },
      {
        value: "sent",
        label: "Yêu cầu gửi Admin",
        icon: Send,
        content: <WorkRequestPanel role="MANAGER" />,
      },
      {
        value: "policies",
        label: "Chính sách đang áp dụng",
        icon: FileCheck2,
        content: <PoliciesPanel />,
      },
    ];
  return [
    {
      value: "work",
      label: "Việc từ Manager",
      icon: ClipboardList,
      content: <WorkRequestPanel role="ADMIN" />,
    },
    {
      value: "proposals",
      label: "Đề xuất đã gửi",
      icon: Inbox,
      content: <ApprovalInboxPanel role="ADMIN" />,
    },
  ];
}

export function ApprovalsPage() {
  const { role } = useAuth();
  return (
    <AppShell title="Hộp yêu cầu">
      <PageTabs tabs={tabsFor(role)} />
    </AppShell>
  );
}
