import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { money, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currentUser, logAction, periodsStore, roleStore, txnStore } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/reconciliation")({
  head: seo("Đối soát", "Đối soát giao dịch chưa đối soát theo khoảng ngày."),
  component: Page,
});

function Page() {
  const txns = txnStore.use();
  const periods = periodsStore.use();
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-14");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const closed = (at: string) =>
    periods.some((p) => p.closed && at.slice(5, 7) + "/" + at.slice(0, 4) === p.month);
  const invalid = from > to;
  const rows = invalid
    ? []
    : txns.filter(
        (t) =>
          t.status === "SUCCESS" &&
          !t.reconciled &&
          t.at.slice(0, 10) >= from &&
          t.at.slice(0, 10) <= to &&
          !closed(t.at),
      );
  const sum = rows.filter((r) => picked.has(r.id)).reduce((a, r) => a + r.amount, 0);
  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const confirm = () => {
    const by = `${currentUser(roleStore.get())} · ${new Date().toLocaleString("vi-VN")}`;
    txnStore.set((l) =>
      l.map((t) => (picked.has(t.id) ? { ...t, reconciled: true, reconciledBy: by } : t)),
    );
    logAction("Đối soát", `${picked.size} giao dịch`);
    toast.success(`Đã đối soát ${picked.size} giao dịch`);
    setPicked(new Set());
  };
  return (
    <AppShell title="Đối soát giao dịch" roles={["ADMIN", "ACCOUNTANT"]}>
      <Section
        title="Giao dịch chưa đối soát"
        action={
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-9 w-40"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span>→</span>
            <Input
              type="date"
              className="h-9 w-40"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        }
      >
        {invalid && <p className="mb-3 text-sm text-destructive">Khoảng thời gian không hợp lệ</p>}
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3 text-sm">
          <span>
            Đã chọn <b>{picked.size}</b> giao dịch · Tổng <b>{money(sum)}</b>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPicked(new Set(rows.map((r) => r.id)))}
          >
            Chọn tất cả ({rows.length})
          </Button>
          <Button size="sm" className="ml-auto" disabled={!picked.size} onClick={confirm}>
            Xác nhận “Đã đối soát”
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Mã GD</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Cổng</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
            {rows.map((t) => (
              <TableRow key={t.id} onClick={() => toggle(t.id)} className="cursor-pointer">
                <TableCell>
                  <Checkbox checked={picked.has(t.id)} />
                </TableCell>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.at}</TableCell>
                <TableCell>{t.gateway}</TableCell>
                <TableCell className="text-right">{money(t.amount)}</TableCell>
                <TableCell>
                  <StatusBadge s={t.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </AppShell>
  );
}
