import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { SettingsPage } from "@/pages/settings";

export const Route = createFileRoute("/settings")({
  head: seo(
    "Vai trò & phân quyền",
    "Quyền truy cập màn hình và thao tác của Admin, Manager, Kế toán.",
  ),
  component: SettingsPage,
});
