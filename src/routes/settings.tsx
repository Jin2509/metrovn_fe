import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { SettingsPage } from "@/pages/settings";

export const Route = createFileRoute("/settings")({
  head: seo("Vai trò & phân quyền", "Tạo vai trò và gán quyền cho từng vai trò."),
  component: SettingsPage,
});
