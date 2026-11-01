import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { AuditLogsPage } from "@/pages/auditlogs";

export const Route = createFileRoute("/audit-logs")({
  head: seo("Nhật ký hệ thống", "Nhật ký bảo mật tài khoản từ hệ thống."),
  component: AuditLogsPage,
});
