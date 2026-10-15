import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable, money, Section, StatCard } from "@/components/shared";
import { ExportDialog } from "@/components/export-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleStore, txnStore } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/revenue")({
  head: seo(
    "Thống kê doanh thu",
    "Thống kê doanh thu theo thời gian, dịch vụ và phương thức thanh toán.",
  ),
  component: Page,
});

function Page() {
  const role = roleStore.use();
  const txns = txnStore.use();
  const [f, setF] = useState({
    from: "2026-10-01",
    to: "2026-10-14",
    service: "ALL",
    method: "ALL",
  });
  const [exp, setExp] = useState(false);
  const invalid = f.from > f.to;
  const rows = invalid
    ? []
    : txns.filter(
        (t) =>
          (t.status === "SUCCESS" || t.status === "REFUNDED") &&
          t.at.slice(0, 10) >= f.from &&
          t.at.slice(0, 10) <= f.to &&
          (f.service === "ALL" || t.service === f.service) &&
          (f.method === "ALL" || t.method === f.method),
      );
  const total = rows.reduce((a, t) => a + t.amount, 0),
    refund = rows.reduce((a, t) => a + t.refund, 0);
  const byDay = Object.values(
    rows.reduce<Record<string, { day: string; ve: number; guiXe: number }>>((acc, t) => {
      const d = t.at.slice(8, 10) + "/" + t.at.slice(5, 7);
      acc[d] ??= { day: d, ve: 0, guiXe: 0 };
      if (t.service === "Vé") acc[d].ve += t.amount;
      else acc[d].guiXe += t.amount;
      return acc;
    }, {}),
  ).sort((a, b) => a.day.localeCompare(b.day));
  const bySvc = ["Vé", "Gửi xe"].map((s) => ({
    name: s,
    value: rows.filter((t) => t.service === s).reduce((a, t) => a + t.amount, 0),
  }));
  const byMethod = ["Ví điện tử", "Thẻ ngân hàng", "QR"].map((m) => ({
    name: m,
    value: rows.filter((t) => t.method === m).reduce((a, t) => a + t.amount, 0),
  }));
  const readonly = role === "MANAGER";
  return (
    <AppShell
      title={readonly ? "Doanh thu (chỉ xem)" : "Thống kê doanh thu"}
      actions={
        !readonly && (
          <Button onClick={() => setExp(true)} disabled={!rows.length}>
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          className="w-40"
          value={f.from}
          onChange={(e) => setF({ ...f, from: e.target.value })}
        />
        <span>→</span>
        <Input
          type="date"
          className="w-40"
          value={f.to}
          onChange={(e) => setF({ ...f, to: e.target.value })}
        />
        <Select value={f.service} onValueChange={(v) => setF({ ...f, service: v })}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi dịch vụ</SelectItem>
            <SelectItem value="Vé">Vé</SelectItem>
            <SelectItem value="Gửi xe">Gửi xe</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.method} onValueChange={(v) => setF({ ...f, method: v })}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi phương thức</SelectItem>
            {["Ví điện tử", "Thẻ ngân hàng", "QR"].map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {invalid && <p className="text-sm text-destructive">Khoảng thời gian không hợp lệ</p>}
      {!invalid && !rows.length ? (
        <Section title="Kết quả">
          <p className="py-10 text-center text-muted-foreground">Không có dữ liệu</p>
        </Section>
      ) : (
        !invalid && (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard label="Tổng doanh thu" value={money(total)} />
              <StatCard label="Hoàn tiền" value={money(refund)} />
              <StatCard label="Doanh thu thuần" value={money(total - refund)} />
              <StatCard label="Số giao dịch" value={rows.length} />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Section title="Doanh thu theo ngày">
                  <div className="h-64">
                    <ResponsiveContainer>
                      <LineChart data={byDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip formatter={(v) => money(Number(v))} />
                        <Legend />
                        <Line dataKey="ve" name="Vé" stroke="var(--chart-1)" strokeWidth={2} />
                        <Line
                          dataKey="guiXe"
                          name="Gửi xe"
                          stroke="var(--chart-2)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Section>
              </div>
              <Section title="Theo dịch vụ">
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={bySvc}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={85}
                      >
                        {bySvc.map((_, i) => (
                          <Cell key={i} fill={`var(--chart-${i + 1})`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => money(Number(v))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Section>
            </div>
            <Section title="Theo phương thức thanh toán">
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={byMethod}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v) => money(Number(v))} />
                    <Bar dataKey="value" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="Chi tiết">
              <DataTable
                rows={rows}
                cols={[
                  { h: "Mã GD", c: (t) => t.id },
                  { h: "Thời gian", c: (t) => t.at },
                  { h: "Dịch vụ", c: (t) => t.service },
                  { h: "Phương thức", c: (t) => t.method },
                  { h: "Số tiền", c: (t) => money(t.amount) },
                ]}
              />
            </Section>
          </>
        )
      )}
      <ExportDialog
        open={exp}
        onClose={() => setExp(false)}
        rows={rows}
        title={`Doanh thu ${f.from} – ${f.to}`}
      />
    </AppShell>
  );
}
