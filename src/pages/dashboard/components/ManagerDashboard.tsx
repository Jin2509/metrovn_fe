import { Link } from "@tanstack/react-router";
import { Bot, ChevronRight, Inbox, Smile, Wallet } from "lucide-react";
import { Section, StatCard } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approvalLabel, approvalsStore } from "@/mocks/admin";
import { messagesStore, sessionsStore } from "@/mocks/chatbot";
import { percent } from "@/pages/chatbot/chatbot.service";
import { computeStats, filterLog } from "@/pages/chatbot/chatbot.stats";
import { QuickLinks, RevenueChart } from "@/pages/dashboard/components/DashboardWidgets";

/** Manager: phê duyệt thay đổi, theo dõi doanh thu và chất lượng phục vụ (chatbot). */
export function ManagerDashboard() {
  const pending = approvalsStore.use().filter((a) => a.status === "PENDING");
  const log = filterLog(sessionsStore.use(), messagesStore.use(), { days: 7, channel: "ALL" });
  const bot = computeStats(log.sessions, log.messages);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Yêu cầu chờ duyệt"
          value={pending.length}
          hint="Giá, khuyến mãi, vận hành, tài khoản, chatbot"
          icon={Inbox}
          tone={pending.length ? "accent" : "muted"}
        />
        <StatCard
          label="Doanh thu hôm nay"
          value="512,4 triệu ₫"
          hint="Tất cả dịch vụ"
          icon={Wallet}
        />
        <StatCard
          label="Chatbot nhận diện được câu hỏi"
          value={percent(bot.recognitionRate)}
          hint={`${bot.questions} câu hỏi trong 7 ngày`}
          icon={Bot}
          tone="success"
        />
        <StatCard
          label="Hành khách hài lòng với chatbot"
          value={bot.feedbackCount ? percent(bot.satisfaction) : "—"}
          hint={`Trên ${bot.feedbackCount} lượt đánh giá · 7 ngày`}
          icon={Smile}
          tone="muted"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Section
          title="Hộp phê duyệt"
          description={pending.length ? "Các yêu cầu cũ nhất được xếp trên cùng" : "Đã xử lý hết"}
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/approvals">Mở hộp phê duyệt</Link>
            </Button>
          }
        >
          {pending.length ? (
            <ul className="divide-y">
              {[...pending]
                .reverse()
                .slice(0, 6)
                .map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/approvals"
                      className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.by} · {a.at} · {a.changes.length} thay đổi
                        </p>
                      </div>
                      <Badge variant="secondary" className="font-normal">
                        {approvalLabel[a.type]}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Không có yêu cầu nào đang chờ duyệt.</p>
          )}
        </Section>
        <RevenueChart />
      </div>
      <QuickLinks />
    </>
  );
}
