import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { FaqPanel } from "@/pages/chatbot/components/FaqPanel";

/**
 * Quản trị chatbot hỗ trợ hành khách (UC14): kho tri thức (chatbot_faq).
 * Backend chưa có API phiên/tin nhắn cho quản trị nên tab Thống kê và Lịch sử hội thoại
 * (`StatsPanel`, `SessionsPanel`) tạm ẩn; gắn lại khi có API.
 */
export function ChatbotPage() {
  const { hasPermission } = useAuth();
  return (
    <AppShell title="Chatbot hỗ trợ">
      {hasPermission("CHATBOT_MANAGE") ? (
        <FaqPanel />
      ) : (
        <p className="text-sm text-muted-foreground">
          Tài khoản chưa có quyền quản lý chatbot (CHATBOT_MANAGE).
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Thống kê và lịch sử hội thoại sẽ hiện khi backend có API tổng hợp phiên chatbot cho quản
        trị.
      </p>
    </AppShell>
  );
}
