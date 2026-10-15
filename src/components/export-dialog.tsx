import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { logAction, type Txn } from "@/mocks/admin";
import { cn } from "@/lib/utils";

export function ExportDialog({
  open,
  onClose,
  rows,
  title,
}: {
  open: boolean;
  onClose: () => void;
  rows: Txn[];
  title: string;
}) {
  const [fmt, setFmt] = useState<"pdf" | "xlsx">("xlsx");
  const [pct, setPct] = useState<number | null>(null);
  const run = () => {
    setPct(0);
    const iv = setInterval(
      () =>
        setPct((p) => {
          const n = (p ?? 0) + 20;
          if (n >= 100) {
            clearInterval(iv);
            setTimeout(() => finish(), 200);
          }
          return Math.min(n, 100);
        }),
      250,
    );
  };
  const finish = () => {
    if (fmt === "xlsx") {
      const csv =
        "\uFEFFMã GD,Thời gian,Dịch vụ,Phương thức,Cổng,Số tiền,Hoàn tiền,Trạng thái\n" +
        rows
          .map((t) =>
            [t.id, t.at, t.service, t.method, t.gateway, t.amount, t.refund, t.status].join(","),
          )
          .join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = `${title}.csv`;
      a.click();
    } else {
      const w = window.open("", "_blank");
      w?.document.write(
        `<html><head><title>${title}</title><style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:4px 8px;font-size:12px}</style></head><body><h2>${title}</h2><table><tr><th>Mã GD</th><th>Thời gian</th><th>Dịch vụ</th><th>Số tiền</th><th>Trạng thái</th></tr>${rows.map((t) => `<tr><td>${t.id}</td><td>${t.at}</td><td>${t.service}</td><td>${t.amount.toLocaleString("vi-VN")}</td><td>${t.status}</td></tr>`).join("")}</table></body></html>`,
      );
      w?.document.close();
      w?.print();
    }
    logAction("Xuất báo cáo", `${title} (${fmt.toUpperCase()})`);
    toast.success("Đã xuất báo cáo");
    setPct(null);
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && pct === null && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xuất báo cáo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["xlsx", "Excel", FileSpreadsheet],
              ["pdf", "PDF", FileText],
            ] as const
          ).map(([k, l, I]) => (
            <button
              key={k}
              onClick={() => setFmt(k)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4",
                fmt === k && "border-primary ring-2 ring-ring",
              )}
            >
              <I className="h-8 w-8 text-primary" />
              {l}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {rows.length} dòng dữ liệu · {title}
        </p>
        {pct !== null && (
          <div className="space-y-1">
            <Progress value={pct} />
            <p className="text-xs text-muted-foreground">Đang tạo báo cáo… {pct}%</p>
          </div>
        )}
        <Button onClick={run} disabled={pct !== null}>
          Xuất {fmt === "pdf" ? "PDF" : "Excel"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
