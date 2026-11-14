import type { ReportFormat, ReportRow } from "@/lib/api";

export const REPORTS_KEY = ["reports"] as const;

/** Số tiền rút gọn cho thẻ chỉ số, số đầy đủ nằm ở dòng phụ và trong bảng. */
export function shortMoney(value: number) {
  const format = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  if (value >= 1e9) return `${format(value / 1e9)} tỷ VND`;
  if (value >= 1e6) return `${format(value / 1e6)} triệu VND`;
  return `${value.toLocaleString("vi-VN")} VND`;
}

/** Nhãn dòng của báo cáo theo ngày (yyyy-MM-dd) → dd/MM cho trục biểu đồ. */
export const shortDay = (label: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(label) ? `${label.slice(8, 10)}/${label.slice(5, 7)}` : label;

/** Tỉ trọng của từng dòng trong tổng, theo số tiền (nếu có) hoặc số lượt. */
export function withShare(rows: ReportRow[]) {
  const value = (r: ReportRow) => r.amountVnd ?? r.count;
  const total = rows.reduce((sum, r) => sum + value(r), 0);
  return rows.map((r) => ({ ...r, share: total ? value(r) / total : 0 }));
}

export const invalidRange = (from: string, to: string) => !from || !to || from > to;

/** Tải file trình duyệt từ nội dung nhị phân. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const exportFileName = (
  kind: "DoanhThu" | "LuuLuong",
  from: string,
  to: string,
  format: ReportFormat,
) => `HopOn_${kind}_${from}_${to}.${format}`;
