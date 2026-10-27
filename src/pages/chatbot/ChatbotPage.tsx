import { BookOpenText, ChartNoAxesColumn, MessagesSquare } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { FaqPanel } from "@/pages/chatbot/components/FaqPanel";
import { SessionsPanel } from "@/pages/chatbot/components/SessionsPanel";
import { StatsPanel } from "@/pages/chatbot/components/StatsPanel";

/**
 * Quản trị chatbot hỗ trợ hành khách (UC14). Chatbot chỉ tra cứu dữ liệu hệ thống;
 * web quản trị theo dõi hoạt động, xem lại hội thoại và quản lý kho tri thức (chatbot_faq).
 */
export function ChatbotPage() {
  const { can } = useAuth();
  return (
    <AppShell title="Chatbot hỗ trợ">
      <PageTabs
        tabs={[
          { value: "stats", label: "Thống kê", icon: ChartNoAxesColumn, content: <StatsPanel /> },
          {
            value: "conversations",
            label: "Lịch sử hội thoại",
            icon: MessagesSquare,
            content: <SessionsPanel />,
            hidden: !can("chatbot.conversations"),
          },
          {
            value: "knowledge",
            label: "Kho tri thức",
            icon: BookOpenText,
            content: <FaqPanel />,
            hidden: !can("chatbot.manage"),
          },
        ]}
      />
    </AppShell>
  );
}
