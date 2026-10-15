import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { operationConfigsStore, submitApproval, trains } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/trains")({
  head: seo("Tàu & vận hành", "Danh sách đoàn tàu và cấu hình vận hành theo phiên bản."),
  component: Page,
});

function Page() {
  const configs = operationConfigsStore.use();
  const send = (id: string) => {
    const c = configs.find((x) => x.id === id)!;
    const cur = configs.find((x) => x.status === "ACTIVE");
    operationConfigsStore.set((l) => l.map((x) => (x.id === id ? { ...x, status: "PENDING" } : x)));
    submitApproval("OPERATION", `Cấu hình vận hành ${c.version}`, [
      { field: "Giãn cách", old: cur?.headway ?? "—", new: c.headway },
      { field: "Giờ vận hành", old: cur?.hours ?? "—", new: c.hours },
    ]);
    toast.success("Đã gửi Manager duyệt");
  };
  return (
    <AppShell title="Tàu & cấu hình vận hành" roles={["ADMIN"]}>
      <Section title="Đoàn tàu">
        <DataTable
          rows={trains}
          cols={[
            { h: "Mã tàu", c: (t) => t.code },
            { h: "Tuyến", c: (t) => t.line },
            { h: "Số toa", c: (t) => t.cars },
            { h: "Sức chứa", c: (t) => t.capacity.toLocaleString("vi-VN") },
            { h: "Trạng thái", c: (t) => <StatusBadge s={t.status} /> },
          ]}
        />
      </Section>
      <Section title="Cấu hình vận hành (DRAFT → chờ duyệt → hiệu lực)">
        <DataTable
          rows={configs}
          cols={[
            { h: "Phiên bản", c: (c) => <b>{c.version}</b> },
            { h: "Giãn cách", c: (c) => c.headway },
            { h: "Giờ vận hành", c: (c) => c.hours },
            { h: "Trạng thái", c: (c) => <StatusBadge s={c.status} /> },
            { h: "Người duyệt", c: (c) => c.approvedBy || "—" },
            {
              h: "",
              c: (c) =>
                c.status === "DRAFT" && (
                  <Button size="sm" onClick={() => send(c.id)}>
                    Gửi duyệt
                  </Button>
                ),
            },
          ]}
        />
      </Section>
    </AppShell>
  );
}
