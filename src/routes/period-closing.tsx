import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable, money, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logAction, periodsStore, txnStore } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/period-closing")({
  head: seo("Chốt kỳ", "Tổng hợp doanh thu, hoàn tiền, khuyến mãi theo tháng và chốt kỳ."),
  component: Page,
});

function Page() {
  const periods = periodsStore.use();
  const txns = txnStore.use();
  const [m, setM] = useState<string | null>(null);
  const pendingRec = txns.filter((t) => t.status === "SUCCESS" && !t.reconciled).length;
  return (
    <AppShell title="Chốt kỳ / quyết toán" roles={["ACCOUNTANT"]}>
      <Section title="Tổng hợp theo tháng">
        <p className="mb-3 text-sm text-muted-foreground">
          Sau khi chốt, giao dịch trong kỳ không thể đối soát lại.
        </p>
        <DataTable
          rows={periods}
          cols={[
            { h: "Kỳ", c: (p) => <b>{p.month}</b> },
            { h: "Doanh thu", c: (p) => money(p.revenue) },
            { h: "Hoàn tiền", c: (p) => money(p.refund) },
            { h: "Khuyến mãi", c: (p) => money(p.promo) },
            { h: "Thuần", c: (p) => <b>{money(p.revenue - p.refund - p.promo)}</b> },
            {
              h: "Trạng thái",
              c: (p) => (
                <StatusBadge
                  s={p.closed ? "APPROVED" : "PENDING"}
                  label={p.closed ? "Đã chốt" : "Đang mở"}
                />
              ),
            },
            {
              h: "",
              c: (p) =>
                !p.closed && (
                  <Button size="sm" onClick={() => setM(p.month)}>
                    <Lock className="h-3.5 w-3.5" />
                    Chốt kỳ
                  </Button>
                ),
            },
          ]}
        />
      </Section>
      <AlertDialog open={!!m} onOpenChange={(o) => !o && setM(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chốt kỳ {m}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRec > 0 ? `Còn ${pendingRec} giao dịch chưa đối soát trong hệ thống. ` : ""}
              Sau khi chốt sẽ không thể đối soát lại các giao dịch trong kỳ này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                periodsStore.set((l) => l.map((p) => (p.month === m ? { ...p, closed: true } : p)));
                logAction("Chốt kỳ", m ?? "");
                toast.success(`Đã chốt kỳ ${m}`);
              }}
            >
              Chốt kỳ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
