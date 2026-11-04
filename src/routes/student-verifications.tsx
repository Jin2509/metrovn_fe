import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { StudentVerificationsPage } from "@/pages/studentverification";

export const Route = createFileRoute("/student-verifications")({
  head: seo("Xác nhận sinh viên", "Hồ sơ cần xem xét và quy tắc tự động xác nhận sinh viên."),
  validateSearch: tabSearch,
  component: StudentVerificationsPage,
});
