import { createFileRoute } from "@tanstack/react-router";
import { MembershipTierPage } from "@/pages/membershiptier";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/membership-tiers")({
  head: seo("Hạng thành viên", "Cấu hình ngưỡng điểm, hệ số và quyền lợi hạng thành viên."),
  component: MembershipTierPage,
});
