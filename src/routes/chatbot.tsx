import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { ChatbotPage } from "@/pages/chatbot";

export const Route = createFileRoute("/chatbot")({
  head: seo(
    "Chatbot hỗ trợ",
    "Thống kê, lịch sử hội thoại và kho tri thức của chatbot hỗ trợ hành khách.",
  ),
  validateSearch: tabSearch,
  component: ChatbotPage,
});
