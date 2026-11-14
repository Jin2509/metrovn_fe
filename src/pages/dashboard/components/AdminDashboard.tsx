import { Section } from "@/components/shared";
import { useUserNames } from "@/hooks/use-user-names";
import { fmtInstant } from "@/lib/query-sync";
import { approvalLabel, approvalsStore, parkingLotsStore } from "@/stores/admin";
import { announcementsStore } from "@/stores/announcements";
import { stationsStore } from "@/stores/metro";
import { trainsStore } from "@/stores/operations";
import { workRequestsStore } from "@/stores/requests";
import { useAdminDashboardData, useTodayReports } from "@/pages/dashboard/dashboard.data";
import {
  IncidentQuickList,
  KpiStrip,
  NetworkModel,
  RevenueChart,
  TaskList,
} from "@/pages/dashboard/components/DashboardWidgets";
import { inboxCount } from "@/pages/approvals/work-requests.service";

const SHOWN_REQUESTS = 4;

/** Admin: mạng lưới và sự cố là việc chính; mục đã gửi duyệt và việc tồn nằm bên cạnh. */
export function AdminDashboard() {
  useAdminDashboardData();
  const report = useTodayReports();
  const nameOf = useUserNames();
  const stations = stationsStore.use();
  const trains = trainsStore.use();
  const announcements = announcementsStore.use();
  const approvals = approvalsStore.use();
  const pending = approvals.filter((a) => a.status === "PENDING");
  const workToDo = inboxCount("ADMIN", workRequestsStore.use(), approvals);
  const fullLots = parkingLotsStore.use().filter((p) => p.used >= 0.85).length;
  const drafts = announcements.filter((a) => a.status === "DRAFT").length;
  const rejected = approvals.filter((a) => a.status === "REJECTED").length;
  const available = trains.filter(
    (t) => t.status === "READY" || t.status === "IN_OPERATION",
  ).length;
  const trainsDown = trains.filter(
    (t) => t.status === "MAINTENANCE" || t.status === "OUT_OF_SERVICE",
  ).length;
  const open = stations.filter((s) => s.status === "ACTIVE");

  return (
    <>
      <KpiStrip
        items={[
          { label: "Doanh thu hôm nay", value: report.revenueText },
          { label: "Giao dịch hôm nay", value: report.paymentsText },
          {
            label: "Lượt qua cổng hôm nay",
            value: report.trafficText,
            hint: `${open.length} ga đang hoạt động`,
          },
          { label: "Đoàn tàu khả dụng", value: `${available}/${trains.length}` },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <NetworkModel />
          {report.canRevenue && (
            <RevenueChart
              rows={report.week}
              loading={report.weekLoading}
              error={report.weekError}
            />
          )}
        </div>
        <div className="min-w-0 space-y-6">
          <IncidentQuickList />
          <TaskList
            tasks={[
              { label: "Yêu cầu từ Manager cần xử lý", count: workToDo, to: "/approvals" },
              {
                label: "Đề xuất bị Manager từ chối",
                count: rejected,
                to: "/approvals",
                tab: "proposals",
              },
              {
                label: "Thông báo còn ở bản nháp",
                count: drafts,
                to: "/notifications",
                tab: "history",
              },
              {
                label: "Ga đang bảo trì",
                count: stations.filter((s) => s.status === "MAINTENANCE").length,
                to: "/stations",
              },
              { label: "Đoàn tàu bảo dưỡng hoặc ngừng", count: trainsDown, to: "/trains" },
              {
                label: "Bãi xe trên 85% sức chứa",
                count: fullLots,
                to: "/tickets",
                tab: "parking",
              },
            ]}
          />
          <Section title={`Đang chờ Manager duyệt (${pending.length})`}>
            {pending.length ? (
              <ul className="-my-2 divide-y">
                {pending.slice(0, SHOWN_REQUESTS).map((a) => (
                  <li key={a.id} className="py-2.5">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {approvalLabel[a.type]} · {nameOf(a.by)} · {fmtInstant(a.at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Không có mục nào đang chờ.</p>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
