import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import futuSvg from "@/components/brand/futu.svg?raw";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { logAction } from "@/mocks/admin";
import { reportToHtml } from "@/pages/reports/reports.service";
import type { ReportExport } from "@/pages/reports/reports.types";

const PRINT_FRAME_ID = "report-print-frame";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** In qua khung ẩn thay vì mở tab mới, nên không bị trình duyệt chặn cửa sổ bật lên. */
function printReport(report: ReportExport) {
  document.getElementById(PRINT_FRAME_ID)?.remove();
  const frame = document.createElement("iframe");
  frame.id = PRINT_FRAME_ID;
  frame.title = "Bản in báo cáo";
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
  // Nhúng thẳng logo để bản in không phụ thuộc mạng.
  frame.srcdoc = reportToHtml(report, `data:image/svg+xml,${encodeURIComponent(futuSvg)}`);
  frame.onload = () => frame.contentWindow?.print();
  document.body.append(frame);
}

export function ExportDialog({
  open,
  onClose,
  report,
}: {
  open: boolean;
  onClose: () => void;
  report: ReportExport;
}) {
  const [format, setFormat] = useState<"pdf" | "xlsx">("xlsx");
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    try {
      if (format === "xlsx") {
        // Tải thư viện Excel khi cần, để không làm nặng trang báo cáo.
        const { reportToXlsx } = await import("@/pages/reports/report-excel");
        download(await reportToXlsx(report), `${report.fileName}.xlsx`);
      } else printReport(report);
      logAction("Xuất báo cáo", `${report.fileName} (${format.toUpperCase()})`);
      toast.success(
        format === "xlsx" ? "Đã xuất báo cáo" : "Đã mở hộp thoại in, chọn Lưu thành PDF",
      );
      onClose();
    } catch {
      toast.error("Chưa xuất được báo cáo, vui lòng thử lại");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xuất báo cáo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["xlsx", "Excel (.xlsx)", FileSpreadsheet],
              ["pdf", "PDF (bản in)", FileText],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              aria-pressed={format === key}
              onClick={() => setFormat(key)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4",
                format === key && "border-primary ring-2 ring-ring",
              )}
            >
              <Icon className="h-8 w-8 text-primary" />
              {label}
            </button>
          ))}
        </div>
        <dl className="space-y-1 text-sm">
          {report.meta.slice(0, 2).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Số ga trong báo cáo</dt>
            <dd className="font-medium">{report.rows.length}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Mẫu gồm kỳ báo cáo, số liệu tổng hợp, bảng theo từng ga, dòng tổng cộng và phần ký duyệt.
        </p>
        <Button onClick={run} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Xuất {format === "pdf" ? "PDF" : "Excel"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
