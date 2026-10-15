import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataTable, money, Section, StatusBadge } from "@/components/shared";
import {
  approvalLabel,
  approvalsStore,
  distancePricesStore,
  operationConfigsStore,
  parkingPricesStore,
  ticketTypesStore,
  tiersStore,
} from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/policies")({
  head: seo(
    "Chính sách đang áp dụng",
    "Tổng hợp bảng giá, thời hạn vé, hạng thành viên, giờ vận hành.",
  ),
  component: Page,
});

function Page() {
  const prices = distancePricesStore.use(),
    types = ticketTypesStore.use(),
    parking = parkingPricesStore.use(),
    tiers = tiersStore.use();
  const op = operationConfigsStore.use().find((c) => c.status === "ACTIVE");
  const history = approvalsStore.use().filter((a) => a.status !== "PENDING");
  return (
    <AppShell title="Chính sách đang áp dụng" roles={["MANAGER"]}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Giá vé lượt">
          <DataTable
            rows={prices}
            cols={[
              { h: "Khoảng cách", c: (p) => `${p.from}–${p.to} km` },
              { h: "Giá", c: (p) => money(p.price) },
              { h: "Hiệu lực", c: (p) => p.effective },
            ]}
          />
        </Section>
        <Section title="Thời hạn vé">
          <DataTable
            rows={types}
            cols={[
              { h: "Loại", c: (t) => t.name },
              { h: "Thời hạn", c: (t) => t.validity },
              { h: "Giá", c: (t) => (t.price ? money(t.price) : "Theo km") },
            ]}
          />
        </Section>
        <Section title="Giá gửi xe">
          <DataTable
            rows={parking}
            cols={[
              { h: "Loại xe", c: (p) => p.vehicle },
              { h: "Đơn vị", c: (p) => p.unit },
              { h: "Giá", c: (p) => money(p.price) },
            ]}
          />
        </Section>
        <Section title="Hạng thành viên">
          <DataTable
            rows={tiers}
            cols={[
              { h: "Hạng", c: (t) => t.name },
              { h: "Ngưỡng", c: (t) => t.threshold },
              { h: "Hệ số", c: (t) => `×${t.multiplier}` },
            ]}
          />
        </Section>
      </div>
      <Section title="Giờ vận hành">
        <p className="text-sm">
          {op ? (
            <>
              Phiên bản <b>{op.version}</b>: {op.hours} · giãn cách {op.headway} · duyệt bởi{" "}
              {op.approvedBy}
            </>
          ) : (
            "Chưa có cấu hình hiệu lực"
          )}
        </p>
      </Section>
      <Section title="Lịch sử phê duyệt">
        <DataTable
          rows={history}
          cols={[
            { h: "Loại", c: (a) => approvalLabel[a.type] },
            { h: "Nội dung", c: (a) => a.title },
            { h: "Người quyết định", c: (a) => a.decidedBy },
            { h: "Kết quả", c: (a) => <StatusBadge s={a.status} /> },
          ]}
        />
      </Section>
    </AppShell>
  );
}
