import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ReasonDialog, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useUserNames } from "@/hooks/use-user-names";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtInstant } from "@/lib/query-sync";
import { approvalLabel, approvalsStore, type Approval } from "@/stores/admin";
import { announcementsStore } from "@/stores/announcements";
import { incidentsStore } from "@/stores/incidents";
import { workRequestsStore } from "@/stores/requests";
import {
  applyApprovalDecision,
  sourceKey,
  useApprovalsData,
} from "@/pages/approvals/approvals.service";
import { useTodayReports } from "@/pages/dashboard/dashboard.data";
import {
  IncidentQuickList,
  KpiStrip,
  NetworkModel,
  RevenueChart,
  SeeAll,
  TaskList,
} from "@/pages/dashboard/components/DashboardWidgets";
import { isOpen } from "@/pages/incidents/incidents.service";
import { SEVERITY_LABELS } from "@/pages/notifications/notifications.constants";
import {
  phaseOf,
  scopeLabel,
  useAnnouncementsData,
} from "@/pages/notifications/notifications.service";
import {
  studentStats,
  studentVerificationsStore,
} from "@/pages/studentverification/student.service";

const SHOWN_REQUESTS = 5;
const SHOWN_CHANGES = 3;

function ApprovalQuickList({ pending }: { pending: Approval[] }) {
  const queryClient = useQueryClient();
  const { canDecide } = useApprovalsData();
  const { user } = useAuth();
  const nameOf = useUserNames();
  const [rejecting, setRejecting] = useState<Approval | null>(null);
  const [busy, setBusy] = useState(false);
  const oldestFirst = [...pending].reverse().slice(0, SHOWN_REQUESTS);
  const allowed = (a: Approval) => canDecide[a.type] && a.by !== user?.id;

  const decide = async (approval: Approval, reason?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await applyApprovalDecision(approval, reason ? "REJECTED" : "APPROVED", reason);
      toast.success(reason ? "Đã từ chối" : "Đã phê duyệt");
      setRejecting(null);
      await queryClient.invalidateQueries({ queryKey: sourceKey(approval.type) });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      title={`Chờ bạn duyệt (${pending.length})`}
      description={pending.length ? "Yêu cầu cũ nhất xếp trên cùng" : undefined}
      action={<SeeAll to="/approvals">Mở hộp phê duyệt</SeeAll>}
    >
      {oldestFirst.length ? (
        <ul className="-my-3 divide-y">
          {oldestFirst.map((approval) => (
            <li key={approval.id} className="flex flex-wrap items-start gap-3 py-3">
              <div className="min-w-0 flex-1 basis-64">
                <p className="text-sm font-medium">{approval.title}</p>
                <p className="text-xs text-muted-foreground">
                  {approvalLabel[approval.type]} · {nameOf(approval.by)} · {fmtInstant(approval.at)}
                </p>
                <ul className="mt-1.5 space-y-0.5 text-xs">
                  {approval.changes.slice(0, SHOWN_CHANGES).map((change) => (
                    <li key={change.field}>
                      <span className="text-muted-foreground">{change.field}: </span>
                      {change.old !== "—" && (
                        <>
                          <span className="text-muted-foreground line-through">{change.old}</span>
                          {" → "}
                        </>
                      )}
                      <span className="font-medium">{change.new}</span>
                    </li>
                  ))}
                  {approval.changes.length > SHOWN_CHANGES && (
                    <li className="text-muted-foreground">
                      Và {approval.changes.length - SHOWN_CHANGES} thay đổi khác, xem ở hộp phê
                      duyệt
                    </li>
                  )}
                </ul>
              </div>
              {allowed(approval) && (
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => void decide(approval)}>
                    Duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setRejecting(approval)}
                  >
                    Từ chối
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Không còn yêu cầu nào chờ duyệt.</p>
      )}
      <ReasonDialog
        open={!!rejecting}
        title={rejecting ? `Từ chối: ${rejecting.title}` : ""}
        confirmLabel="Từ chối"
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => rejecting && void decide(rejecting, reason)}
      />
    </Section>
  );
}

/** Manager: duyệt yêu cầu ngay tại đây là việc chính, sự cố và thông báo để theo dõi. */
export function ManagerDashboard() {
  const { hasPermission } = useAuth();
  useAnnouncementsData(
    hasPermission("ANNOUNCEMENT_MANAGE") || hasPermission("ANNOUNCEMENT_APPROVE"),
  );
  const report = useTodayReports();
  const pending = approvalsStore.use().filter((a) => a.status === "PENDING");
  const incidents = incidentsStore.use().filter(isOpen);
  const students = studentStats(studentVerificationsStore.use());
  const notices = announcementsStore.use().filter((a) => phaseOf(a) === "ACTIVE");
  const requests = workRequestsStore.use();
  const needsInfo = requests.filter((r) => r.status === "NEEDS_INFO").length;
  const toConfirm = requests.filter((r) => r.status === "RESOLVED").length;

  return (
    <>
      <KpiStrip
        items={[
          { label: "Chờ duyệt", value: pending.length },
          {
            label: "Sự cố đang mở",
            value: incidents.length,
            hint: `${incidents.filter((i) => i.severity === "CRITICAL").length} khẩn cấp`,
          },
          { label: "Hồ sơ sinh viên cần xem", value: students.needsReview },
          { label: "Doanh thu hôm nay", value: report.revenueText },
        ]}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <ApprovalQuickList pending={pending} />
          <NetworkModel />
        </div>
        <div className="min-w-0 space-y-6">
          <TaskList
            title="Yêu cầu gửi Admin"
            tasks={[
              {
                label: "Admin cần bạn bổ sung thông tin",
                count: needsInfo,
                to: "/approvals",
                tab: "sent",
              },
              {
                label: "Admin báo xong, chờ bạn xác nhận",
                count: toConfirm,
                to: "/approvals",
                tab: "sent",
              },
            ]}
          />
          <IncidentQuickList />
          <Section title={`Thông báo đang hiệu lực (${notices.length})`}>
            {notices.length ? (
              <ul className="-my-2 divide-y">
                {notices.map((a) => (
                  <li key={a.id} className="py-2.5 text-sm">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {SEVERITY_LABELS[a.severity]} · {scopeLabel(a)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Không có thông báo nào.</p>
            )}
          </Section>
          {report.canRevenue && (
            <RevenueChart
              rows={report.week}
              loading={report.weekLoading}
              error={report.weekError}
            />
          )}
        </div>
      </div>
    </>
  );
}
