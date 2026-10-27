import {
  Building2,
  CircleParking,
  MailWarning,
  Megaphone,
  MessageCircleQuestion,
  Ticket,
  TrainFront,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useMemo } from "react";
import { Section, StatCard, StatusBadge } from "@/components/shared";
import { availableTrains } from "@/lib/operations";
import { approvalLabel, approvalsStore, parkingLots } from "@/mocks/admin";
import { announcementsStore } from "@/mocks/announcements";
import { handledQuestionsStore, messagesStore, sessionsStore } from "@/mocks/chatbot";
import { stationsStore } from "@/mocks/metro";
import { trainsStore } from "@/mocks/operations";
import { filterLog, unrecognizedQuestions } from "@/pages/chatbot/chatbot.stats";
import { activeForPassengers } from "@/pages/notifications/notifications.service";
import {
  HourlyFlowChart,
  QuickLinks,
  RevenueChart,
  TaskList,
} from "@/pages/dashboard/components/DashboardWidgets";

/** Admin: quản lý mạng lưới, giá, tài khoản, thông báo vận hành và kho tri thức chatbot. */
export function AdminDashboard() {
  const stations = stationsStore.use();
  const trains = trainsStore.use();
  const announcements = announcementsStore.use();
  const sessions = sessionsStore.use();
  const messages = messagesStore.use();
  const handled = handledQuestionsStore.use();
  const pending = approvalsStore.use().filter((a) => a.status === "PENDING");

  const activeNotices = activeForPassengers(announcements).length;
  const failedSends = announcements.reduce((n, a) => n + (a.delivery?.failed ?? 0), 0);
  const unrecognized = useMemo(() => {
    const log = filterLog(sessions, messages, { days: 7, channel: "ALL" });
    return unrecognizedQuestions(log.messages).filter((q) => !handled[q.question]).length;
  }, [sessions, messages, handled]);
  const open = stations.filter((s) => s.status === "ACTIVE");
  const maintenance = stations.filter((s) => s.status === "MAINTENANCE").length;
  const trainsDown = trains.filter(
    (t) => t.status === "MAINTENANCE" || t.status === "OUT_OF_SERVICE",
  ).length;
  const fullLots = parkingLots.filter((p) => p.used >= 0.85).length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doanh thu hôm nay"
          value="512,4 triệu ₫"
          hint="Vé và gửi xe, giao dịch thành công"
          icon={Wallet}
        />
        <StatCard
          label="Vé đã bán hôm nay"
          value="48.215"
          hint="Đơn hàng đã thanh toán"
          icon={Ticket}
          tone="accent"
        />
        <StatCard
          label="Lượt vào ga"
          value={open.reduce((a, s) => a + s.dailyFlow, 0).toLocaleString("vi-VN")}
          hint={`Từ lịch sử quét vé · ${open.length} ga hoạt động`}
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Đoàn tàu khả dụng"
          value={`${availableTrains("L1", trains)}/${trains.length}`}
          hint="Đang chạy hoặc sẵn sàng"
          icon={TrainFront}
          tone="muted"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <TaskList
          tasks={[
            {
              label: "Thông báo vận hành đang hiệu lực",
              hint: "Hành khách đang thấy trong ứng dụng",
              count: activeNotices,
              icon: Megaphone,
              to: "/notifications",
              tab: "history",
              tone: "accent",
            },
            {
              label: "Lượt gửi thông báo bị lỗi",
              hint: "Gửi lại cho người nhận bị lỗi trong chi tiết thông báo",
              count: failedSends,
              icon: MailWarning,
              to: "/notifications",
              tab: "history",
              tone: "destructive",
            },
            {
              label: "Câu hỏi chatbot chưa nhận diện được",
              hint: "7 ngày qua, chưa thêm vào kho tri thức",
              count: unrecognized,
              icon: MessageCircleQuestion,
              to: "/chatbot",
            },
            {
              label: "Ga đang bảo trì",
              hint: "Kiểm tra đã có thông báo cho hành khách",
              count: maintenance,
              icon: Building2,
              to: "/stations",
            },
            {
              label: "Đoàn tàu bảo dưỡng / ngừng sử dụng",
              hint: "Ảnh hưởng số tàu khả dụng của cấu hình vận hành",
              count: trainsDown,
              icon: Wrench,
              to: "/trains",
            },
            {
              label: "Bãi xe trên 85% sức chứa",
              hint: "Theo lượt gửi xe đang có tại bãi",
              count: fullLots,
              icon: CircleParking,
              to: "/tickets",
              tab: "parking",
            },
          ]}
        />
        <Section
          title="Đang chờ Manager duyệt"
          description="Thay đổi chỉ có hiệu lực sau khi được duyệt"
        >
          {pending.length ? (
            <ul className="divide-y">
              {pending.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {approvalLabel[a.type]} · {a.by} · {a.at}
                    </p>
                  </div>
                  <StatusBadge s={a.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Không có yêu cầu nào đang chờ.</p>
          )}
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <HourlyFlowChart />
      </div>
      <QuickLinks />
    </>
  );
}
