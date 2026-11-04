import { useMemo } from "react";
import { Section } from "@/components/shared";
import { availableTrains } from "@/lib/operations";
import { approvalLabel, approvalsStore, parkingLotsStore } from "@/mocks/admin";
import { announcementsStore } from "@/mocks/announcements";
import { handledQuestionsStore, messagesStore, sessionsStore } from "@/mocks/chatbot";
import { stationsStore } from "@/mocks/metro";
import { trainsStore } from "@/mocks/operations";
import { filterLog, unrecognizedQuestions } from "@/pages/chatbot/chatbot.stats";
import {
  IncidentQuickList,
  KpiStrip,
  NetworkModel,
  RevenueChart,
  TaskList,
} from "@/pages/dashboard/components/DashboardWidgets";

const SHOWN_REQUESTS = 4;

/** Admin: mạng lưới và sự cố là việc chính; yêu cầu đã gửi và việc tồn nằm bên cạnh. */
export function AdminDashboard() {
  const stations = stationsStore.use();
  const trains = trainsStore.use();
  const announcements = announcementsStore.use();
  const sessions = sessionsStore.use();
  const messages = messagesStore.use();
  const handled = handledQuestionsStore.use();
  const pending = approvalsStore.use().filter((a) => a.status === "PENDING");
  const fullLots = parkingLotsStore.use().filter((p) => p.used >= 0.85).length;

  const failedSends = announcements.reduce((n, a) => n + (a.delivery?.failed ?? 0), 0);
  const unrecognized = useMemo(() => {
    const log = filterLog(sessions, messages, { days: 7, channel: "ALL" });
    return unrecognizedQuestions(log.messages).filter((q) => !handled[q.question]).length;
  }, [sessions, messages, handled]);
  const open = stations.filter((s) => s.status === "ACTIVE");
  const trainsDown = trains.filter(
    (t) => t.status === "MAINTENANCE" || t.status === "OUT_OF_SERVICE",
  ).length;

  return (
    <>
      <KpiStrip
        items={[
          { label: "Doanh thu hôm nay", value: "512,4 triệu VND" },
          { label: "Vé đã bán hôm nay", value: "48.215" },
          {
            label: "Lượt vào ga",
            value: open.reduce((a, s) => a + s.dailyFlow, 0).toLocaleString("vi-VN"),
            hint: `${open.length} ga đang hoạt động`,
          },
          {
            label: "Đoàn tàu khả dụng",
            value: `${availableTrains("L1", trains)}/${trains.length}`,
          },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <NetworkModel />
          <RevenueChart />
        </div>
        <div className="min-w-0 space-y-6">
          <IncidentQuickList />
          <TaskList
            tasks={[
              {
                label: "Lượt gửi thông báo bị lỗi",
                count: failedSends,
                to: "/notifications",
                tab: "history",
              },
              { label: "Câu hỏi chatbot chưa nhận diện", count: unrecognized, to: "/chatbot" },
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
          <Section title={`Yêu cầu đang chờ Manager duyệt (${pending.length})`}>
            {pending.length ? (
              <ul className="-my-2 divide-y">
                {pending.slice(0, SHOWN_REQUESTS).map((a) => (
                  <li key={a.id} className="py-2.5">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {approvalLabel[a.type]} · {a.at}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Không có yêu cầu nào đang chờ.</p>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
