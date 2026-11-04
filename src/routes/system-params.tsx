import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { SystemParamsPage } from "@/pages/systemparams";

export const Route = createFileRoute("/system-params")({
  head: seo("Tham số hệ thống", "Cấu hình nghiệp vụ chung, thay đổi phải được Manager phê duyệt."),
  component: SystemParamsPage,
});
