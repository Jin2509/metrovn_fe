import { useState } from "react";
import { toast } from "sonner";
import { ReasonDialog, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { approvalLabel, approvalsStore, type Approval } from "@/mocks/admin";
import { announcementsStore } from "@/mocks/announcements";
import { incidentsStore } from "@/mocks/incidents";
import { applyApprovalDecision } from "@/pages/approvals/approvals.service";
import {
  IncidentQuickList,
  KpiStrip,
  NetworkModel,
  RevenueChart,
  SeeAll,
} from "@/pages/dashboard/components/DashboardWidgets";
import { isOpen } from "@/pages/incidents/incidents.service";
import { SEVERITY_LABELS } from "@/pages/notifications/notifications.constants";
import { phaseOf, scopeLabel } from "@/pages/notifications/notifications.service";
import {
  studentStats,
  studentVerificationsStore,
} from "@/pages/studentverification/student.service";

const SHOWN_REQUESTS = 5;
const SHOWN_CHANGES = 3;

function ApprovalQuickList({ pending }: { pending: Approval[] }) {
  const [rejecting, setRejecting] = useState<Approval | null>(null);
  const oldestFirst = [...pending].reverse().slice(0, SHOWN_REQUESTS);

  const decide = (approval: Approval, reason?: string) => {
    const error = applyApprovalDecision(approval, reason ? "REJECTED" : "APPROVED", reason);
    if (error) return toast.error(error);
    toast.success(reason ? "Đã từ chối" : "Đã phê duyệt");
    setRejecting(null);
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
                  {approvalLabel[approval.type]} · {approval.by} · {approval.at}
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
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(approval)}>
                  Duyệt
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejecting(approval)}>
                  Từ chối
                </Button>
              </div>
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
        onConfirm={(reason) => rejecting && decide(rejecting, reason)}
      />
    </Section>
  );
}

/** Manager: duyệt yêu cầu ngay tại đây là việc chính, sự cố và thông báo để theo dõi. */
export function ManagerDashboard() {
  const pending = approvalsStore.use().filter((a) => a.status === "PENDING");
  const incidents = incidentsStore.use().filter(isOpen);
  const students = studentStats(studentVerificationsStore.use());
  const notices = announcementsStore.use().filter((a) => phaseOf(a) === "ACTIVE");

  return (
    <>
      <KpiStrip
        items={[
          { label: "Chờ duyệt", value: pending.length },
          {
            label: "Sự cố đang mở",
            value: incidents.length,
            hint: `${incidents.filter((i) => i.severity === "EMERGENCY").length} khẩn cấp`,
          },
          { label: "Hồ sơ sinh viên cần xem", value: students.needsReview },
          { label: "Doanh thu hôm nay", value: "512,4 triệu VND" },
        ]}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <ApprovalQuickList pending={pending} />
          <NetworkModel />
        </div>
        <div className="min-w-0 space-y-6">
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
          <RevenueChart />
        </div>
      </div>
    </>
  );
}
