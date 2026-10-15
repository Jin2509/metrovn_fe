import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, money, Section, StatusBadge } from "@/components/shared";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { txnStore, type Txn } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/transactions")({
  head: seo("Giao dịch", "Tra cứu giao dịch thanh toán toàn hệ thống."),
  component: Page,
});

function Page() {
  const txns = txnStore.use();
  const [f, setF] = useState({
    q: "",
    status: "ALL",
    method: "ALL",
    gateway: "ALL",
    rec: "ALL",
    from: "",
    to: "",
  });
  const [sel, setSel] = useState<Txn | null>(null);
  const rows = txns.filter(
    (t) =>
      (f.status === "ALL" || t.status === f.status) &&
      (f.method === "ALL" || t.method === f.method) &&
      (f.gateway === "ALL" || t.gateway === f.gateway) &&
      (f.rec === "ALL" || String(t.reconciled) === f.rec) &&
      (!f.from || t.at >= f.from) &&
      (!f.to || t.at.slice(0, 10) <= f.to) &&
      (t.id + t.orderId).toLowerCase().includes(f.q.toLowerCase()),
  );
  const sel3 = (k: keyof typeof f, opts: [string, string][], w = "w-40") => (
    <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}>
      <SelectTrigger className={w}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opts.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return (
    <AppShell title="Giao dịch" roles={["ADMIN", "ACCOUNTANT"]}>
      <Section title="Tra cứu giao dịch">
        <div className="mb-3 flex flex-wrap gap-2">
          <Input
            placeholder="Mã GD / đơn hàng"
            className="w-44"
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
          />
          <Input
            type="date"
            className="w-40"
            value={f.from}
            onChange={(e) => setF({ ...f, from: e.target.value })}
          />
          <Input
            type="date"
            className="w-40"
            value={f.to}
            onChange={(e) => setF({ ...f, to: e.target.value })}
          />
          {sel3("status", [
            ["ALL", "Mọi trạng thái"],
            ["PENDING", "PENDING"],
            ["SUCCESS", "SUCCESS"],
            ["FAILED", "FAILED"],
            ["REFUNDED", "REFUNDED"],
          ])}
          {sel3("method", [
            ["ALL", "Mọi phương thức"],
            ["Ví điện tử", "Ví điện tử"],
            ["Thẻ ngân hàng", "Thẻ ngân hàng"],
            ["QR", "QR"],
          ])}
          {sel3(
            "gateway",
            [
              ["ALL", "Mọi cổng"],
              ["MoMo", "MoMo"],
              ["VNPay", "VNPay"],
              ["ZaloPay", "ZaloPay"],
            ],
            "w-32",
          )}
          {sel3("rec", [
            ["ALL", "Đối soát: tất cả"],
            ["true", "Đã đối soát"],
            ["false", "Chưa đối soát"],
          ])}
        </div>
        <DataTable
          rows={rows}
          onRow={setSel}
          pageSize={12}
          cols={[
            { h: "Mã GD", c: (t) => t.id },
            { h: "Thời gian", c: (t) => t.at },
            { h: "Dịch vụ", c: (t) => t.service },
            { h: "Số tiền", c: (t) => money(t.amount), className: "text-right" },
            { h: "Phương thức", c: (t) => `${t.method} · ${t.gateway}` },
            { h: "Trạng thái", c: (t) => <StatusBadge s={t.status} /> },
            {
              h: "Đối soát",
              c: (t) => <StatusBadge s={t.reconciled ? "RECONCILED" : "UNRECONCILED"} />,
            },
          ]}
        />
      </Section>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent>
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle>Giao dịch {sel.id}</SheetTitle>
              </SheetHeader>
              <dl className="grid grid-cols-2 gap-3 px-4 text-sm">
                {(
                  [
                    ["Đơn hàng", sel.orderId],
                    ["Thời gian", sel.at],
                    ["Dịch vụ", sel.service],
                    ["Số tiền", money(sel.amount)],
                    ["Hoàn tiền", money(sel.refund)],
                    ["Phương thức", sel.method],
                    ["Cổng", sel.gateway],
                    ["Mã cổng", `${sel.gateway.toUpperCase()}-${sel.id.slice(2)}`],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-muted-foreground">Trạng thái</dt>
                  <dd>
                    <StatusBadge s={sel.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Đối soát</dt>
                  <dd>
                    <StatusBadge s={sel.reconciled ? "RECONCILED" : "UNRECONCILED"} />
                    {sel.reconciledBy && <p className="text-xs">{sel.reconciledBy}</p>}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
